var script = document.createElement('script')
var blob = new Blob(['window.postMsg = window.postMessage'], { type: 'text/javascript' })
script.src = URL.createObjectURL(blob)
document.documentElement.appendChild(script)
