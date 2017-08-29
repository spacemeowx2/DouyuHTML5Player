import { ISignerResult } from './source'
declare var window: {
  [key: string]: any
} & Window

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
export class Signer {
  static _port: WrapPort
  static _state: SignerState = SignerState.None
  static onStateChanged: (newState: SignerState) => void = () => null
  static async sign (rid: string, tt: number, did: string): Promise<ISignerResult> {
    return (await this._port('sign', rid, tt, did))[0]
  }
  static _flash: any
  static set state (val: SignerState) {
    if (Signer._state === SignerState.Timeout) { // timeout 时不再加载
      return
    }
    if (val !== Signer._state) {
      Signer._state = val
      this.onStateChanged(Signer.state)
    } else {
      Signer._state = val
    }
  }
  static get state () {
    return Signer._state
  }
  static init () {
    const port = wrapPort(chrome.runtime.connect({name: "signer"}))
    Signer._port = port
    let iid = window.setInterval(async () => {
      let ret = await port('query')
      console.log('query', ret)
      if (ret) {
        Signer.state = SignerState.Loaded
        Signer.state = SignerState.Ready
        if (iid !== null) {
          window.clearInterval(iid)
          iid = null
        }
      }
    }, 100)
    window.setTimeout(() => {
      if (this.state !== SignerState.Ready) {
        this.state = SignerState.Timeout
      }
      if (iid !== null) {
        window.clearInterval(iid)
        iid = null
      }
    }, 15 * 1000)
  }
}
