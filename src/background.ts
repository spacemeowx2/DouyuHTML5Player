import FlashEmu from 'flash-emu'
import { PortHandler, Port } from 'utils/extension'
import { uint8ToBase64, header2Object } from 'utils/helper'
import { idleUnload, Unloadable } from 'utils/idle-unload'

FlashEmu.BUILTIN = 'dist/builtin.abc'
FlashEmu.PLAYERGLOBAL = 'dist/playerglobal.abc'
FlashEmu.setGlobalFlags({
  enableDebug: false,
  enableLog: false,
  enableWarn: false,
  enableError: false
})

class AutoSigner implements Unloadable<[string, string, string], {sign: string, cptl: string}> {
  emu: FlashEmu | null = null
  CModule: any
  xx: any
  async load () {
    console.log('Loading signer')
    const emu = new FlashEmu({
      async readFile (filename: string) {
        const res = await fetch(filename)
        const buf = await res.arrayBuffer()
        return new Uint8Array(buf).buffer as ArrayBuffer
      }
    })
    await emu.runSWF('dist/douyu.swf', false)
    const vm = emu.getVM()
    const CModule = vm.getProxy(emu.getProperty('sample.mp', 'CModule'))
    const xx = vm.getProxy(emu.getPublicClass('mp'))
    CModule.callProperty('startAsync')

    this.CModule = CModule
    this.xx = xx
    this.emu = emu
    console.log('Load done')
  }
  async unload () {
    this.emu = null
    this.CModule = null
    this.xx = null
    console.log('Unload signer')
  }
  async execute (roomId: string, time: string, did: string) {
    const { CModule, xx } = this

    let StreamSignDataPtr = CModule.callProperty('malloc', 4)
    let outptr1 = CModule.callProperty('malloc', 4)

    let datalen = xx.callProperty('sub_2', parseInt(roomId), parseInt(time), did.toString(), outptr1, StreamSignDataPtr)

    let pSign = CModule.callProperty('read32', StreamSignDataPtr)
    let sign = CModule.callProperty('readString', pSign, datalen) as string
    let pOut = CModule.callProperty('read32', outptr1)
    let out = CModule.callProperty('readString', pOut, 4) as string
    CModule.callProperty('free', StreamSignDataPtr)
    CModule.callProperty('free', outptr1)
    console.log('sign result', sign)
    return {
      sign,
      cptl: out
    }
  }
}
const signer = idleUnload(new AutoSigner(), 30)

interface FetchMessage {
  method: 'fetch' | 'json' | 'arrayBuffer' | 'body.getReader' | 'reader.read' | 'reader.cancel'
  args: any[]
}
interface SignerMessage {
  method: 'sign'
  // roomId, time, did
  args: [string, string, string]
}
class FetchHandler implements PortHandler<FetchMessage> {
  port: Port
  reader!: ReadableStreamReader
  response!: Response
  constructor (port: Port) {
    this.port = port
  }
  onDisconnect () {
    if (this.reader) {
      this.reader.cancel()
    }
  }
  async process (msg: FetchMessage) {
    if (msg.method === 'fetch') {
      const r = await fetch(...msg.args)
      this.response = r
      console.log('response', r)
      return {
        bodyUsed: r.bodyUsed,
        ok: r.ok,
        status: r.status,
        statusText: r.statusText,
        type: r.type,
        url: r.url,
        headers: header2Object(r.headers)
      }
    } else if (msg.method === 'json') {
      return await this.response.json()
    } else if (msg.method === 'arrayBuffer') {
      const buf = await this.response!.arrayBuffer()
      return Array.from(new Uint8Array(buf))
    } else if (msg.method === 'body.getReader') {
      this.reader = this.response.body!.getReader()
      console.log('reader', this.reader)
    } else if (msg.method === 'reader.read') {
      let r = await this.reader!.read()
      if (r.done === false) {
        r.value = uint8ToBase64(r.value)
      }
      return r
    } else if (msg.method === 'reader.cancel') {
      return this.reader.cancel()
    } else {
      this.port.disconnect()
    }
  }
  async onMessage (msg: FetchMessage) {
    try {
      const args = [await this.process(msg)]
      const outMsg = {
        method: msg.method,
        args: args
      }
      this.port.postMessage(outMsg)
    } catch (e) {
      console.log(e)
      this.port.postMessage({
        method: msg.method,
        err: {
          name: e.name,
          message: e.message,
          stack: e.stack,
          string: e.toString()
        }
      })
    }
  }
}
class SignerHandler implements PortHandler<SignerMessage> {
  port: Port
  constructor (port: Port) {
    this.port = port
  }
  onDisconnect () {

  }
  async onMessage (msg: SignerMessage) {
    let args = []
    if (msg.method === 'sign') {
      args.push(await signer(...msg.args))
    }
    this.port.postMessage({
      method: msg.method,
      args: args
    })
  }
}

const connectListener = (port: chrome.runtime.Port) => {
  let handler: PortHandler<any>
  if (port.name === 'fetch') {
    console.log('new fetch port', port)
    handler = new FetchHandler(port)
  } else if (port.name === 'signer') {
    console.log('new signer port', port)
    handler = new SignerHandler(port)
  }
  port.onDisconnect.addListener(() => handler.onDisconnect())
  port.onMessage.addListener(msg => handler.onMessage(msg))
}
chrome.runtime.onConnect.addListener(connectListener)
chrome.runtime.onConnectExternal.addListener(connectListener)
