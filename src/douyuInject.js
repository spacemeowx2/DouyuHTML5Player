import JSocket from '../libs/JSocket'
import { douyuApi } from './douyuClient'

const getRoomId = () => {
  try {
    return window.$ROOM.room_id
  } catch (e) {}
  try {
    return /rid=(\d+)/.exec(document.querySelector('.feedback-report-button').href)[1]
  } catch (e) {}
  try {
    return document.querySelector('.current').getAttribute('data-room_id')
  } catch (e) {}
  throw new Error('未找到RoomId')
}
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