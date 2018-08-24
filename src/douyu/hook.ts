const emptyFunc = () => {}
let originUse = emptyFunc
let useOrigin = false

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

export type RoomInfo = { roomId: string, id: string }
export type Callback = (param: RoomInfo) => void
const handler: ProxyHandler<Window> = {
  get (target: any, p: PropertyKey, receiver: any): any {
    console.log('proxy', p)
    return target[p]
  }
}
export const hookH5 = (callback: Callback) => {
  const player = window['require']('douyu-liveH5/live/js/player')
  const postReady = (player: any) => {
    const roomId = player.flashvars.RoomId
    console.log('RoomId', roomId)
    const ctr = document.getElementById(player.root.id)!
    const box = document.createElement('div')
    box.id = `space_douyu_html5_player`
    ctr.appendChild(box)
    callback({
      roomId,
      id: box.id
    })
  }
  const fakePlayer = {
    init (root: HTMLElement, param: any) {
      console.log('fake init', param)
      postReady(param)
    },
    load (param: any) {
      console.log('fake load', param)
      postReady(param)
    }
  }
  if (player === null) {
    console.log('player null, hook `require.use`')
    const oldUse = window.require.use
    hookFunc(window, 'require', (old, args) => {
      const name = args[0]
      if (name === 'douyu-liveH5/live/js/h5') {
        return fakePlayer
      }
      let ret = old.apply(null, args)
      return ret
    })
    window.require.use = oldUse
    hookFunc(window.require, 'use', (old, args) => {
      const name: string = args[0][0]

      if (!useOrigin && name.indexOf('douyu-liveH5/live/js') !== -1) {
        const cb: Function = args[1]

        console.log('require.use', name)
        old(args[0], (...cbArgs: any[]) => {
          console.log('hook callback', cbArgs)
          cb(...cbArgs)
        }, ...args.slice(2))
      } else {
        let ret = old.apply(null, args)
        return ret
      }
    })
  } else {
    if (player.h5player) {
      player.h5player.destroy()
      postReady(player.params)
    } else {
      console.error('TODO player: 1 h5player: 0')
    }
  }
}
export const hookFlash = (callback: Callback) => {
  hookFunc(document, 'createElement', (old, args) => {
    let ret = old.apply(null, args)
    if (args[0] == 'object') {
      hookFunc(ret, 'setAttribute', (old, args) => {
        // console.log(args)
        if (args[0] == 'data') {
          if (/WebRoom/.test(args[1])) {
            setTimeout(() => {
              let roomId = getRoomIdFromFlash(getParam(ret, 'flashvars'))
              console.log('RoomId', roomId)
              callback({
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
}
export function hook (callback: Callback) {
  hookFlash(callback)
  hookH5(callback)
}
