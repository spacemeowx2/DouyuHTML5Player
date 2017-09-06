import { ISignerResult } from './source'
import { runtime } from '../chrome'
export enum SignerState {
  None,
  Loaded,
  Ready,
  Timeout
}
type WrapPort = (method: string, ...args: any[]) => Promise<any>
function wrapPort (port: chrome.runtime.Port) {
  let curMethod = ''
  let curResolve: (value?: any[] | PromiseLike<any[]>) => void = null
  let curReject:(reason?: any) => void = null
  let stack = new Error().stack
  port.onMessage.addListener((msg: any) => {
    if (msg.method === curMethod) {
      curResolve(msg.args[0])
    } else {
      curReject('wtf')
      console.error('wtf?')
    }
  })
  return function (method: string, ...args: any[]) {
    return new Promise<any[]>((resolve, reject) => {
      curMethod = method
      curResolve = resolve
      curReject = reject
      port.postMessage({
        method: method,
        args: args
      })
    })
  }
}
interface ISigner {
  // onStateChanged: SignerStateListener
  state: SignerState
  sign (rid: string, tt: number, did: string): Promise<ISignerResult>
  init (): Promise<void>
}
class BackgroundSigner {
  private static _inited: boolean = false
  private static _port: WrapPort
  private static _state: SignerState = SignerState.None
  private static _resolve: Function
  private static _reject: Function
  private static _clean () {
    this._resolve = null
    this._reject = null
  }
  private static onStateChanged (state: SignerState) {
    if (state === SignerState.Ready) {
      this._inited = true
      this._resolve()
      this._clean()
    } else if (state === SignerState.Timeout) {
      this._reject()
      this._clean()
    } else {
      return
    }
  }
  private static setState (val: SignerState) {
    if (this._state === SignerState.Timeout) { // timeout 时不再加载
      return
    }
    if (val !== this._state) {
      this._state = val
      this.onStateChanged(this.state)
    } else {
      this._state = val
    }
  }
  static async sign (rid: string, tt: number, did: string): Promise<ISignerResult> {
    return await this._port('sign', rid, tt, did)
  }
  static get state () {
    return this._state
  }
  static init (): Promise<void> {
    if (this._inited) {
      return Promise.resolve()
    }
    return new Promise<void>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
      const port = wrapPort(runtime.connect({name: "signer"}))
      this._port = port
      let iid = window.setInterval(async () => {
        let ret = await port('query')
        console.log('query', ret)
        if (ret) {
          this.setState(SignerState.Loaded)
          this.setState(SignerState.Ready)
          if (iid !== null) {
            window.clearInterval(iid)
            iid = null
          }
        }
      }, 100)
      window.setTimeout(() => {
        if (this.state !== SignerState.Ready) {
          this.setState(SignerState.Timeout)
        }
        if (iid !== null) {
          window.clearInterval(iid)
          iid = null
        }
      }, 15 * 1000)
    })
  }
}

let Signer: ISigner
if (USERSCRIPT) {
  const DB_NAME = 'shared-worker-signer'
  const DB_VERSION = 1
  const DB_STORE_NAME = 'cache'
  class ManualCache {
    db: IDBDatabase
    errCode: number
    initDB () {
      return new Promise((resolve, reject) => {
        const that = this
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onsuccess = function (evt) {
          that.db = this.result
          resolve(that)
        }
        req.onerror = function (evt: any) {
          that.errCode = evt.target.errorCode
          reject(that.errCode)
        }
        req.onupgradeneeded = function (evt: any) {
          const store = evt.currentTarget.result.createObjectStore(DB_STORE_NAME)
        }
      })
    }
    getArrayBuffer (key: string, url: string) {
      return this.getFile(key).then((file: any) => {
        if (file && file.url === url) {
          return file.data
        } else {
          return this.fetchAndSave(key, url)
        }
      })
    }
    private putFile (key: string, url: string, data: ArrayBuffer) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(DB_STORE_NAME, 'readwrite')
        const store = tx.objectStore(DB_STORE_NAME)
        const req = store.put({data: data, url: url}, key)
        
        req.onsuccess = function (evt) {
          resolve()
        }
        req.onerror = function () {
          reject(this.error)
        }
      })
    }
    private getFile (key: string) {
      return new Promise((resolve, reject) => {
        const tx = this.db.transaction(DB_STORE_NAME, 'readonly')
        const store = tx.objectStore(DB_STORE_NAME)
        
        const req = store.get(key)
        req.onsuccess = function ({target}: any) {
          resolve(target.result)
        }
        req.onerror = function () {
          reject(this.error)
        }
      })
    }
    private fetchAndSave (key: string, url: string) {
      return fetch(url).then(res => res.arrayBuffer()).then(buffer => this.putFile(key, url, buffer).then(() => buffer))
    }
  }
  const manualCache = new ManualCache()
  const signerURL = `data:text/javascript,importScripts('https://imspace.nos-eastchina1.126.net/shared-worker-signer_v0.0.3.js')`
  // const signerURL = `data:text/javascript,importScripts('http://localhost:5000/shared-worker-signer.js')`
  class SharedWorkerSigner {
    private static _inited = false
    private static _resolve: Function
    private static _reject: Function
    private static _state: SignerState = SignerState.None
    private static _worker: SharedWorker.SharedWorker
    private static _stopQuery = false
    private static _clean () {
      this._resolve = null
      this._reject = null
    }
    private static onMessage ({data}: any) {
      console.log('onMessage', data)
      if (data.type === 'query') {
        if (data.data === true) {
          this._resolve()
          this._clean()
          this._stopQuery = true
        } else {
          setTimeout(() => this.query(), 100)
        }
      } else if (data.type === 'sign') {
        this._resolve(data.data)
        this._clean()
      } else if (data.type === 'error') {
        this._reject(data.data)
        this._clean()
      } else if (data.type === 'getArrayBuffer') {
        manualCache.getArrayBuffer(data.key, data.url).then(buffer => {
          this._worker.port.postMessage({
            type: 'getArrayBuffer',
            data: buffer
          }, [buffer])
        }).catch((e) => {
          this._worker.port.postMessage({
            type: 'getArrayBuffer',
            err: e
          })
        })
      }
    }
    static get state () {
      return this._state
    }
    static async sign (rid: string, tt: number, did: string): Promise<ISignerResult> {
      return new Promise<ISignerResult>((resolve, reject) => {
        this._worker.port.postMessage({
          type: 'sign',
          args: [rid, tt, did]
        })
        this._resolve = resolve
        this._reject = reject
      })
    }
    static init (): Promise<void> {
      if (this._inited) {
        return Promise.resolve()
      }
      return manualCache.initDB().then(() => new Promise<void>((resolve, reject) => {
        this._resolve = resolve
        this._reject = reject
        const worker = new SharedWorker(signerURL)
        this._worker = worker
        worker.port.onmessage = e => this.onMessage(e)
        window.setTimeout(() => this.query(), 500)
        window.setTimeout(() => {
          if (this.state !== SignerState.Ready) {
            this._state = SignerState.Timeout
          }
          if (this._stopQuery === false) {
            this._stopQuery = true
          }
        }, 15 * 1000)
      }))
    }
    static query () {
      if (!this._stopQuery) {
        this._worker.port.postMessage({
          type: 'query'
        })
      }
    }
  }
  Signer = SharedWorkerSigner
} else {
  Signer = BackgroundSigner
}
export {
  Signer
}
