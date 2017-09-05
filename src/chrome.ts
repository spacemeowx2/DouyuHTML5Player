const pageAction = {
  setIcon (details: chrome.pageAction.IconDetails) {
    return new Promise<void>((res, rej) => {
      chrome.pageAction.setIcon(details, res)
    })
  }
}
const runtime = {
  sendMessage (message: any) {
    return chrome.runtime.sendMessage(message)
  },
  connect (connectInfo?: chrome.runtime.ConnectInfo) {
    return chrome.runtime.connect(connectInfo)
  }
}
export function hasChrome () {
  return typeof chrome !== 'undefined'
}
export {
  pageAction,
  runtime
}
