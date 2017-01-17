import JSocket from '../JSocket'
import { douyuApi, getRoomId } from './api'

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