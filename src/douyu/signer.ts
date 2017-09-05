import { ISignerResult } from './source'

export enum SignerState {
  None,
  Loaded,
  Ready,
  Timeout
}
type WrapPort = (method: string, ...args: any[]) => Promise<any[]>
function wrapPort (port: chrome.runtime.Port) {
  let curMethod = ''
  let curResolve: (value?: any[] | PromiseLike<any[]>) => void = null
  let curReject:(reason?: any) => void = null
  let stack = new Error().stack
  port.onMessage.addListener((msg: any) => {
    if (msg.method === curMethod) {
      curResolve(msg.args)
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
    BackgroundSigner._resolve = null
    BackgroundSigner._reject = null
  }
  private static onStateChanged (state: SignerState) {
    if (state === SignerState.Ready) {
      BackgroundSigner._inited = true
      BackgroundSigner._resolve()
      BackgroundSigner._clean()
    } else if (state === SignerState.Timeout) {
      BackgroundSigner._reject()
      BackgroundSigner._clean()
    } else {
      return
    }
  }
  private static setState (val: SignerState) {
    if (BackgroundSigner._state === SignerState.Timeout) { // timeout 时不再加载
      return
    }
    if (val !== BackgroundSigner._state) {
      BackgroundSigner._state = val
      this.onStateChanged(BackgroundSigner.state)
    } else {
      BackgroundSigner._state = val
    }
  }
  static async sign (rid: string, tt: number, did: string): Promise<ISignerResult> {
    return (await this._port('sign', rid, tt, did))[0]
  }
  static get state () {
    return BackgroundSigner._state
  }
  static init (): Promise<void> {
    if (BackgroundSigner._inited) {
      return Promise.resolve()
    }
    return new Promise<void>((resolve, reject) => {
      BackgroundSigner._resolve = resolve
      BackgroundSigner._reject = reject
      const port = wrapPort(chrome.runtime.connect({name: "signer"}))
      BackgroundSigner._port = port
      let iid = window.setInterval(async () => {
        let ret = await port('query')
        console.log('query', ret)
        if (ret) {
          BackgroundSigner.setState(SignerState.Loaded)
          BackgroundSigner.setState(SignerState.Ready)
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
class SharedWorkerSigner {
  private static _state: SignerState = SignerState.None
  static get state () {
    return SharedWorkerSigner._state
  }
}
export function getSigner (): ISigner {
  if (USERSCRIPT) {
    return SharedWorkerSigner
  } else {
    return BackgroundSigner
  }
}
