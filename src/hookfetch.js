function hookFetchCode () {
  // let self = this
  const objectToHeader = (headers) => {
    let out = new Headers()
    for (let key of Object.keys(headers)) {
      out.set(key, headers[key])
    }
    return out
  }
  const headerToObject = (headers) => {
    let out = {}
    for (let key of headers.keys()) {
      out[key] = headers.get(key)
    }
    return out
  }
  const hideHookStack = stack => {
    return stack.replace(/^\s*at\s.*?hookfetch\.js:\d.*$\n/mg, '')
  }
  const base64ToUint8 = (b64) => {
    const s = atob(b64)
    const length = s.length
    let ret = new Uint8Array(length)
    for (let i = 0; i < length; i++) {
      ret[i] = s.charCodeAt(i)
    }
    return ret
  }
  class ProxyConnect {
    constructor () {
      let frame = document.createElement('iframe')
      frame.src = chrome.runtime.getURL('dist/proxy.html')
      frame.hidden = true
      document.body.appendChild(frame)

      frame.onload = () => this.onLoad()
      this.ready = false
      this.frame = frame
      this.waiting = []
    }
    onLoad () {
      this.ready = true
      for (let p of this.waiting) {
        p(this.frame)
      }
      this.waiting = []
    }
    init () {
      if (this.ready) {
        return Promise.resolve(this.frame)
      }
      return new Promise((resolve, reject) => {
        this.waiting.push(resolve)
      })
    }
  }
  const bridgeConnect = new ProxyConnect()
  const initIframe = () => bridgeConnect.init()
  const connectBackground = () => {
    return initIframe().then((frame) => new Promise((resolve, reject) => {
      frame.contentWindow.postMessage({
        type: 'connect'
      }, '*')
      const onMessage = ({data}) => {
        if (data.type === 'connect') {
          window.removeEventListener('message', onMessage)
          const port = data.port
          resolve(port)
        }
      }
      window.addEventListener('message', onMessage)
    }))
  }
  class BaseWrap {
    constructor () {
      this.curMethod = ''
      this.curResolve = null
      this.curReject = null
      this.stack = ''
      this.lastDone = true
    }
    _postMessage (data) {
      throw new Error('not impl')
    }
    post (method, args) {
      if (!this.lastDone) {
        throw new Error('Last post is not done')
      }
      this.stack = new Error().stack
      return new Promise((resolve, reject) => {
        this.lastDone = false
        this.curMethod = method
        this.curResolve = resolve
        this.curReject = reject
        return this._postMessage({
          method: method,
          args: args
        })
      })
    }
    onMessage (msg) {
      if (msg.method === this.curMethod) {
        if (msg.err) {
          let err = new Error(msg.err.message)
          err.oriName = msg.err.name
          err.stack = hideHookStack(this.stack)
          // console.log('fetch err', err)
          this.curReject.call(null, err)
        } else {
          this.curResolve.apply(null, msg.args)
        }
        this.curResolve = null
        this.curReject = null
        this.lastDone = true
      } else {
        console.error('wtf?')
      }
    }
  }
  class WrapChromePort extends BaseWrap {
    constructor (port) {
      super()
      this.port = port
      port.onMessage.addListener(msg => this.onMessage(msg))
    }
    _postMessage (data) {
      this.port.postMessage(data)
    }
  }
  class WrapMessagePort extends BaseWrap {
    /**
     * 
     * @param {MessagePort} port 
     */
    _postMessage (data) {
      if (this.port) {
        this.port.postMessage(data)
        return
      }
      return connectBackground().then(port => {
        port.onmessage = ({data}) => this.onMessage(data)
        this.port = port
        this.port.postMessage(data)
      })
    }
  }
  class PortReader {
    constructor (port) {
      this.port = port
      this.hasReader = false
    }
    _requireReader () {
      if (this.hasReader) {
        return Promise.resolve()
      } else {
        return this.port.post('body.getReader').then(() => this.hasReader = true)
      }
    }
    read () {
      return this._requireReader()
        .then(() => this.port.post('reader.read'))
        .then(r => {
          if (r.done == false) {
            if (typeof r.value === 'string') {
              r.value = base64ToUint8(r.value)
            } else if (r.value instanceof ArrayBuffer) {
              r.value = new Uint8Array(r.value)
            } else {
              console.log('cnm')
            }
          }
          return r
        })
    }
    cancel () {
      return this._requireReader().then(() => this.port.post('reader.cancel'))
    }
  }
  class PortBody {
    constructor (port) {
      this.port = port
    }
    getReader () {
      return new PortReader(this.port)
    }
  }
  class PortFetch {
    constructor () {
      if (bridgeConnect.ready) {
        this.port = new WrapMessagePort()
      } else {
        this.port = new WrapChromePort(chrome.runtime.connect({name: 'fetch'}))
      }
    }
    fetch (url, opts) {
      if (opts && opts.headers instanceof Headers) {
        opts.headers = headerToObject(opts.headers)
      }
      return this.port.post('fetch', [url, opts]).then(r => {
        r.json = () => this.port.post('json')
        r.arrayBuffer = () => this.port.post('arrayBuffer').then(buf => {
          return new Uint8Array(buf).buffer
        })
        r.headers = objectToHeader(r.headers)
        r.body = new PortBody(this.port)
        return r
      })
    }
  }
  const bgFetch = function bgFetch (...args) {
    const fetch = new PortFetch()
    return fetch.fetch(...args)
  }
  function hookFetch () {
    if (fetch !== bgFetch) {
      fetch = bgFetch
    }
  }
  const oldBlob = Blob
  const newBlob = function newBlob(a, b) {
    a[0] = `(${hookFetchCode})();${a[0]}`
    console.log('new blob', a, b)
    return new oldBlob(a, b)
  }
  // if(self.document !== undefined) {
  //   if (self.Blob !== newBlob) {
  //     self.Blob = newBlob
  //   }
  // }

  hookFetch()
}
function isFirefox () {
  return /Firefox/.test(navigator.userAgent)
}
if (!isFirefox()) {
  hookFetchCode()
}
