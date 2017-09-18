const cPort = new SharedWorker(chrome.runtime.getURL('dist/bridgeWorker.js')).port
cPort.onmessage = ({data}) => {
  const parentWin = window.parent
  let transfer
  if (data.port) {
    transfer = [data.port]
  }
  parentWin.postMessage(data, '*', transfer)
}
cPort.start()
window.addEventListener('message', ({data}) => {
  cPort.postMessage(data)
})
