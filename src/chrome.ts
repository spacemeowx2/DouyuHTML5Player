const pageAction = {
  setIcon (details: chrome.pageAction.IconDetails) {
    return new Promise<void>((res, rej) => {
      chrome.pageAction.setIcon(details, res)
    })
  }
}
export default {
  pageAction
}
