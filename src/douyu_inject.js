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
  JSocket.init('data:application/x-shockwave-flash;base64,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')
  return waitObject(() => JSocket && JSocket.flashapi.newsocket)
})
.then(() => {
  let api = douyuApi(getRoomId())
  api.hookExe()

  window.addEventListener('message', event => {
    if (event.source != window)
      return

    if (event.data.type && (event.data.type == "SENDANMU")) {
      const data = event.data.data
      api.sendDanmu(data)
    }
  }, false)
  //api.sendDanmu
  window.api = api
})
