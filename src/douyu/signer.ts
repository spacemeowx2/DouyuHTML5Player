import {embedSWF} from '../embedSWF'
declare var window: {
  [key: string]: any
} & Window

export enum SignerState {
  None,
  Loaded,
  Ready,
  Timeout
}

export class Signer {
  static _state: SignerState = SignerState.None
  static onStateChanged: (newState: SignerState) => void = () => null
  static sign (rid: string, tt: number, did: string) {
    return this._flash.sign(rid, tt, did)
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
    embedSWF('signer', 'https://imspace.nos-eastchina1.126.net/signer.swf')
    this._flash = document.querySelector('#signer')
    window.setTimeout(() => {
      if (this.state !== SignerState.Ready) {
        this.state = SignerState.Timeout
      }
    }, 15 * 1000) // 15s 应该足够下载1m的swf了...
  }
  static _Loaded () {
    Signer.state = SignerState.Loaded
  }
  static _Ready () {
    Signer.state = SignerState.Ready
  }
}
window.signerLoaded = Signer._Loaded
window.signerReady = Signer._Ready
