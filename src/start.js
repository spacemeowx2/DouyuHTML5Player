var script = document.createElement('script')
script.src = chrome.runtime.getURL('src/backupFunction.js')
document.documentElement.appendChild(script)