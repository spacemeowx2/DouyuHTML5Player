'use strict'
const arrayBuffer2BlobUrl = (buffer) => {
  const blob = new Blob([new Uint8Array(buffer)])
  const url = URL.createObjectURL(blob)
  return url
}
let CModule
let xx
let ready = false
let inited = false
function init (port) {
  if (inited) {
    return
  }
  let res, rej
  port.addEventListener('message', ({data}) => {
    if (data.type === 'getArrayBuffer') {
      if (data.err) {
        rej(data.err)
        return
      }
      res(data.data)
    }
  })
  const getArrayBuffer = (key, url) => {
    return new Promise((resolve, reject) => {
      res = resolve
      rej = reject
      port.postMessage({
        type: 'getArrayBuffer',
        key,
        url
      })
    })
  }
  const getURL = (key, url) => getArrayBuffer(key, url).then(data => arrayBuffer2BlobUrl(data))
  const importScript = (key, url) => getURL(key, url).then(url => importScripts(url))
  fetch('https://douyu.coding.me/shared-worker-signer-manifest.json')
    .then(res => res.json())
    .then((manifest) => {
      console.log('init FlashEmu', manifest)
      return importScript('FlashEmu', manifest.flashemu).then(() => manifest)
    }).then(manifest => {
      console.log('init ok', manifest)
      FlashEmu.BUILTIN = 'builtin'
      FlashEmu.PLAYERGLOBAL = 'playerglobal'
      FlashEmu.setGlobalFlags({
        enableDebug: false,
        enableLog: false,
        enableWarn: false,
        enableError: false
      })
      const emu = new FlashEmu({
        readFile (key) {
          return getArrayBuffer(key, manifest[key])
        }
      })
      emu.runSWF('douyu', false).then(() => {
        CModule = emu.getProperty('sample.mp', 'CModule')
        xx = emu.getPublicClass('mp')
        CModule.callProperty('startAsync')
        ready = true
        console.log('ready')
      })
      inited = true
    }).catch(e => {
      console.error('onerror', e)
    })
}

function sign (roomId, time, did) {
  console.log('sign', roomId, time, did)
  if (!ready) {
    throw new Error('flascc is not ready')
  }
  let StreamSignDataPtr = CModule.callProperty('malloc', 4)
  let outptr1 = CModule.callProperty('malloc', 4)

  let datalen = xx.callProperty('sub_2', parseInt(roomId), parseInt(time), did.toString(), outptr1, StreamSignDataPtr)

  let pSign = CModule.callProperty('read32', StreamSignDataPtr)
  let sign = CModule.callProperty('readString', pSign, datalen)
  let pOut = CModule.callProperty('read32', outptr1)
  let out = CModule.callProperty('readString', pOut, 4)
  CModule.callProperty('free', StreamSignDataPtr)
  CModule.callProperty('free', outptr1)
  console.log('sign result', sign)
  return {
    sign,
    cptl: out
  }
}
onconnect = ({ports}) => {
  console.log('onconnect')
  for (let port of ports) {
    init(port)
    port.addEventListener('message', ({data}) => {
      let ret = {
        type: 'error',
        data: null
      }
      if (data.type === 'sign') {
        if (ready) {
          ret.data = sign(...data.args)
        }
      } else if (data.type === 'query') {
        ret.data = ready
      } else {
        return
      }
      if (ret.data !== null) {
        ret.type = data.type
      }
      port.postMessage(ret)
    })
    port.start()
  }
}
