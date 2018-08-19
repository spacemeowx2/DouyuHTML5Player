import { addScript, getURL, createBlobURL } from 'utils/helper'

async function getText (url: string) {
  const res = await fetch(url)
  return await res.text()
}
async function main () {
  const space = {
    extensionId: chrome.runtime.id
  }
  let text = await Promise.all([
    `window.$$space$$ = ${JSON.stringify(space)};`,
    getText(getURL('dist/js/vue.js')),
    getText(getURL('dist/js/flv.min.js')),
    getText(getURL('dist/js/douyu-inject.js')),
  ])
  addScript(createBlobURL(text.join('\n'), 'text/javascript'))
}
main().catch(e => console.error(e))
