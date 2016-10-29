function waitObject (func) {
  if (Array.isArray(func)) {
    let ary = func
    func = () => ary.every(i => !!i())
  }
  return new Promise((res, rej) => {
    let id = setInterval(() => {
      if (func()) {
        res()
        clearInterval(id)
      }
    }, 500)
  })
}
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
waitObject([() => window.JSocket, () => window.md5, () => window.douyuApi]).then(() => {
  JSocket.init('https://imspace.applinzi.com/player/JSocket.swf')
  return waitObject(() => JSocket && JSocket.flashapi.newsocket)
})
.then(() => {
  let api = douyuApi(getRoomId())
  api.hookExe()
})