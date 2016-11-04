import JSocket from '../../libs/JSocket'
import { douyuApi, getRoomId } from '../douyuApi'

JSocket.init('https://imspace.applinzi.com/player/JSocket.swf', () => douyuApi(getRoomId()).then(api => {
  api.hookExe()

  window.addEventListener('message', event => {
    if (event.source != window)
      return

    if (event.data.type && (event.data.type == "SENDANMU")) {
      const data = event.data.data
      api.sendDanmu(data)
    }
  }, false)
  window.api = api
}))