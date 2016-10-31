let worker = new SharedWorker(chrome.runtime.getURL('src/sharedWorker/sharedWorker.js'))
worker.port.start()
worker.port.onmessage = function(event) {
  console.log('Received message', event.data)
  window.lastMessage = event.data
  let a = new Uint8Array([1,2,3,4])
  worker.port.postMessage({
    msg: 'test',
    data: a.buffer
  }, [a.buffer])
}
