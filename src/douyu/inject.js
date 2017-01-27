import JSocket from '../JSocket'
import { douyuApi, getRoomId } from './api'

window.postMsg = window.postMessage
function hookFunc (obj, funcName, newFunc) {
  var old = obj[funcName]
  obj[funcName] = function () {
    return newFunc.call(this, old.bind(this), Array.from(arguments))
  }
}
function getParam(flash, name) {
  const children = flash.children
  for (let i=0; i<children.length; i++) {
    const param = children[i]
    if (param.name == name) {
      return param.value
    }
  }
  return ''
}
function getRoomIdFromFlash(s) {
  return s.split('&').filter(i => i.substr(0,6) == 'RoomId')[0].split('=')[1]
}
// var wwwtttfff=0
hookFunc(document, 'createElement', (old, args) => {
  var ret = old.apply(null, args)
  if (args[0] == 'object') {
    hookFunc(ret, 'setAttribute', (old, args) => {
      // console.log(args)
      if (args[0] == 'data') {
        if (/WebRoom/.test(args[1])) {
          args[1] = ''
          setTimeout(() => {
            let roomId = getRoomIdFromFlash(getParam(ret, 'flashvars'))
            console.log('RoomId', roomId)
            window.postMsg({
              type: "VIDEOID",
              data: {
                roomId: roomId,
                id: ret.id
              }
            }, "*")
          }, 1)
        }
      }
      return old.apply(null, args)
    })
    // console.log(++wwwtttfff, ret)
  }
  return ret
})

window.addEventListener('message', event => {
  if (event.source != window)
    return

  if (event.data.type) {
    const data = event.data.data
    switch (event.data.type) {
      case 'SENDANMU':
        api.sendDanmu(data)
        break
      case 'VIDEOID':
        JSocket.init('https://imspace.applinzi.com/player/JSocket.swf', () => douyuApi(data.roomId).then(api => {
          api.hookExe()
          window.api = api
        }))
        break
    }
  }
}, false)