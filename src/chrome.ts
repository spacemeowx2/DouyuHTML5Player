const pageAction = {
  setIcon (details: chrome.pageAction.IconDetails) {
    return new Promise<void>((res, rej) => {
      chrome.pageAction.setIcon(details, res)
    })
  }
}
export function hasChrome () {
  return typeof chrome !== 'undefined'
}
export default {
  pageAction
}
