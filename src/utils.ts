import interruptTransfer = chrome.usb.interruptTransfer;

function utf8ToUtf16 (utf8_bytes: number[]) {
  let unicode_codes: number[] = [];
  let unicode_code = 0;
  let num_followed = 0;
  for (let i = 0; i < utf8_bytes.length; ++i) {
    let utf8_byte = utf8_bytes[i];
    if (utf8_byte >= 0x100) {
      // Malformed utf8 byte ignored.
    } else if ((utf8_byte & 0xC0) == 0x80) {
      if (num_followed > 0) {
        unicode_code = (unicode_code << 6) | (utf8_byte & 0x3f);
        num_followed -= 1;
      } else {
        // Malformed UTF-8 sequence ignored.
      }
    } else {
      if (num_followed == 0) {
        unicode_codes.push(unicode_code);
      } else {
        // Malformed UTF-8 sequence ignored.
      }
      if (utf8_byte < 0x80){  // 1-byte
        unicode_code = utf8_byte;
        num_followed = 0;
      } else if ((utf8_byte & 0xE0) == 0xC0) {  // 2-byte
        unicode_code = utf8_byte & 0x1f;
        num_followed = 1;
      } else if ((utf8_byte & 0xF0) == 0xE0) {  // 3-byte
        unicode_code = utf8_byte & 0x0f;
        num_followed = 2;
      } else if ((utf8_byte & 0xF8) == 0xF0) {  // 4-byte
        unicode_code = utf8_byte & 0x07;
        num_followed = 3;
      } else {
        // Malformed UTF-8 sequence ignored.
      }
    }
  }
  if (num_followed == 0) {
    unicode_codes.push(unicode_code);
  } else {
    // Malformed UTF-8 sequence ignored.
  }
  unicode_codes.shift();  // Trim the first element.

  let utf16_codes = [];
  for (var i = 0; i < unicode_codes.length; ++i) {
    unicode_code = unicode_codes[i];
    if (unicode_code < (1 << 16)) {
      utf16_codes.push(unicode_code);
    } else {
      var first = ((unicode_code - (1 << 16)) / (1 << 10)) + 0xD800;
      var second = (unicode_code % (1 << 10)) + 0xDC00;
      utf16_codes.push(first)
      utf16_codes.push(second)
    }
  }
  return utf16_codes;
}

export function utf8_to_ascii( str: string ) {
  // return unescape(encodeURIComponent(str))
  const char2bytes = (unicode_code: number) => {
    let utf8_bytes: number[] = [];
    if (unicode_code < 0x80) {  // 1-byte
      utf8_bytes.push(unicode_code);
    } else if (unicode_code < (1 << 11)) {  // 2-byte
      utf8_bytes.push((unicode_code >>> 6) | 0xC0);
      utf8_bytes.push((unicode_code & 0x3F) | 0x80);
    } else if (unicode_code < (1 << 16)) {  // 3-byte
      utf8_bytes.push((unicode_code >>> 12) | 0xE0);
      utf8_bytes.push(((unicode_code >> 6) & 0x3f) | 0x80);
      utf8_bytes.push((unicode_code & 0x3F) | 0x80);
    } else if (unicode_code < (1 << 21)) {  // 4-byte
      utf8_bytes.push((unicode_code >>> 18) | 0xF0);
      utf8_bytes.push(((unicode_code >> 12) & 0x3F) | 0x80);
      utf8_bytes.push(((unicode_code >> 6) & 0x3F) | 0x80);
      utf8_bytes.push((unicode_code & 0x3F) | 0x80);
    }
    return utf8_bytes;
  }
  let o: number[] = []
  for (let i = 0; i < str.length; i++) {
    o = o.concat(char2bytes(str.charCodeAt(i)))
  }
  return o.map(i => String.fromCharCode(i)).join('')
}
export function ascii_to_utf8( str: string ) {
  let bytes = str.split('').map(i => i.charCodeAt(0))
  return utf8ToUtf16(bytes).map(i => String.fromCharCode(i)).join('')
}
export function requestFullScreen () {
  let de: any = document.documentElement;
  if (de.requestFullscreen) {
    de.requestFullscreen();
  } else if (de.mozRequestFullScreen) {
    de.mozRequestFullScreen();
  } else if (de.webkitRequestFullScreen) {
    de.webkitRequestFullScreen();
  }
}
export function exitFullscreen () {
  let de: any = document;
  if (de.exitFullscreen) {
    de.exitFullscreen();
  } else if (de.mozCancelFullScreen) {
    de.mozCancelFullScreen();
  } else if (de.webkitCancelFullScreen) {
    de.webkitCancelFullScreen();
  }
}
export class LocalStorage {
  constructor (private domain: string) {

  }
  getItem (key: string, def?: string) {
    return window.localStorage.getItem(`${this.domain}-${key}`) || def
  }
  setItem (key: string, data: string) {
    window.localStorage.setItem(`${this.domain}-${key}`, data)
  }
}
export class Timer {
  private id: number
  onTimer: () => void
  constructor (private delay: number) {
    
  }
  reset () {
    if (this.id) {
      clearTimeout(this.id)
    }
    this.id = window.setTimeout(this.onTimer, this.delay)
  }
}
export function getURL (src: string) {
  if (src.substr(0, 5) !== 'blob:') {
    src = chrome.runtime.getURL(src)
  }
  return src
}
export function addScript (src: string) {
  var script = document.createElement('script')
  // blob:
  script.src = getURL(src)
  document.head.appendChild(script)
}

export function addCORsScript(src:string) {
    let script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
}
export function addCss (src: string, rel: string = 'stylesheet', type: string = 'text/css') {
  var link = document.createElement('link')
  link.rel = rel
  link.type = type
  link.href = getURL(src)
  document.head.appendChild(link)
}
export function createBlobURL (content: string, type: string) {
  var blob = new Blob([content], { type })
  return URL.createObjectURL(blob)
}

export const p32 = (i: number) => [i, i / 256, i / 65536, i / 16777216].map(i => String.fromCharCode(Math.floor(i) % 256)).join('')
export const u32 = (s: string) => s.split('').map(i => i.charCodeAt(0)).reduce((a, b) => b * 256 + a)

// ---------------------

let messageMap: any = {}
export function onMessage (type: string, cb: (data: any) => any) {
  messageMap[type] = cb
}
export function postMessage (type: string, data: any) {
  window.postMessage({
    type: type,
    data: data
  }, "*")
}
let msgCallbacks: Function[] = []
let lastCbId = 0
export function sendMessage (type: string, data: any) {
  return new Promise<void>((res, rej) => {
    let curId = lastCbId++
    let timeoutId = window.setTimeout(() => {
      delete msgCallbacks[curId]
      rej()
    }, 5000)
    msgCallbacks[curId] = () => {
      delete msgCallbacks[curId]
      window.clearTimeout(timeoutId)
      res()
    }
    window.postMessage({
      type: type,
      data: data,
      cbId: curId++
    }, '*')
  })
}
window.addEventListener('message', event => {
  if (event.source != window)
    return
  const data = event.data
  if (data.cb) {
    let cb = msgCallbacks[data.cbId]
    if (cb && (typeof cb === 'function')) {
      cb()
    }
  } else if (data.type) {
    if (typeof messageMap[data.type] === 'function') {
      messageMap[data.type](data.data)
    }
    if (data.cbId) {
      window.postMessage({
        cb: true,
        cbId: data.cbId
      }, '*')
    }
  }
}, false)
export async function retry<T> (promise: () => Promise<T>, times: number) {
  let err = []
  for (let i = 0; i < times; i++) {
    try {
      return await promise()
    } catch (e) {
      err.push(e)
    }
  }
  throw err
}
export function getSync () {
  return new Promise<any>((res, rej) => {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(items => {
        res(items)
      })
    } else {
      rej(new Error('不支持的存储方式'))
    }
  })
}
export function setSync (item: any) {
  return new Promise<void>((res, rej) => {
    if (chrome && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(item, res)
    } else {
      rej(new Error('不支持的存储方式'))
    }
  })
}
interface Setting {
  blacklist: string[]
}
export async function getSetting (): Promise<Setting> {
  const setting = await getSync()
  if (!setting.blacklist) {
    setting.blacklist = []
  }
  return setting
}
export async function setSetting (setting: Setting) {
  await setSync(setting)
}
const defaultBgListener = async (request: any): Promise<void> => null
let bgListener = defaultBgListener
export function setBgListener (listener: typeof defaultBgListener) {
  if (bgListener === defaultBgListener) {
    if ((typeof chrome !== 'undefined') && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        sendResponse(await bgListener(request))
      })
    }
  } else {
    console.warn('多次设置BgListener')
  }
  bgListener = listener
}
export async function stableFetcher(url:string, inits:any,timeoutSeconds:number,callbackFunc:Function){
    if (inits) {
        try {
            let XMLHttp = new XMLHttpRequest();
            XMLHttp.withCredentials = false;
            let timeout = setTimeout(function () {
                XMLHttp.abort();
            }, timeoutSeconds*1000);
            XMLHttp.onreadystatechange = function () {
                if (XMLHttp.readyState === 4)  //4表示准备完成
                {
                    clearTimeout(timeout);
                    if (XMLHttp.status === 200)  //200表示回调成功
                    {
                        callbackFunc(XMLHttp.responseText);
                    }
                    else {
                        console.log("stableFetcher request was failure, request url is "+url+" . return status is " + XMLHttp.status);
                    }
                }
            };
            XMLHttp.open(inits.method, url, true);
            if (inits.hasOwnProperty("headers")){
              let z=Object.keys(inits.headers);
              for (let i=0;i<z.length;i++){
                  XMLHttp.setRequestHeader(z[i], inits.headers[z[i]]);
              }
            }
            inits.hasOwnProperty("data") ? XMLHttp.send(inits.data):XMLHttp.send();
        }
        catch(e) {
            console.log(e);
        }
    }
}
export async function fetchText(url:any) {
    return fetch(url).then(request => request.text()).then(text => {return text;}).catch(error => {console.log(`ERROR: ${error.stack}`);});
}