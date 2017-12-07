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

let Signer: ISigner = BackgroundSigner
export {
  Signer
}
