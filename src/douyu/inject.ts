import {JSocket} from '../JSocket'
import { douyuApi, DouyuAPI, ACJ } from './api'
import {onMessage, postMessage, retry} from '../utils'

declare var window: {
  [key: string]: any
} & Window
function hookFunc (obj: any, funcName: string, newFunc: (func: Function, args: any[]) => any) {
  var old = obj[funcName]
  obj[funcName] = function () {
    return newFunc.call(this, old.bind(this), Array.from(arguments))
  }
}
function getParam(flash: any, name: string) {
  const children = flash.children
  for (let i=0; i<children.length; i++) {
    const param = children[i]
    if (param.name == name) {
      return param.value
    }
  }
  return ''
}
function getRoomIdFromFlash(s: string) {
  return s.split('&').filter(i => i.substr(0,6) == 'RoomId')[0].split('=')[1]
}
hookFunc(document, 'createElement', (old, args) => {
  var ret = old.apply(null, args)
  if (args[0] == 'object') {
    hookFunc(ret, 'setAttribute', (old, args) => {
      // console.log(args)
      if (args[0] == 'data') {
        if (/WebRoom/.test(args[1])) {
          // args[1] = ''
          setTimeout(() => {
            let roomId = getRoomIdFromFlash(getParam(ret, 'flashvars'))
            console.log('RoomId', roomId)
            postMessage('VIDEOID', {
                roomId: roomId,
                id: ret.id
            })
          }, 1)
        }
      }
      return old.apply(null, args)
    })
  }
  return ret
})

let api: DouyuAPI
onMessage('BEGINAPI', async data => {
  await retry(() => JSocket.init(), 3)
  api = await douyuApi(data.roomId)
  window.api = api
})
onMessage('SENDANMU', data => {
  api.sendDanmu(data)
})
onMessage('ACJ', data => {
  ACJ(data.id, data.data)
})
