var worker = new SharedWorker(chrome.runtime.getURL('src/sharedWorker/sharedWorker.js'));
worker.port.start();
worker.port.onmessage = function(event) {
    console.log('Received message', event.data);
    window.lastMessage = event.data;
};
worker.port.postMessage('Hello');