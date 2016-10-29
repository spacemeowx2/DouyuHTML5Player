function hookFetchCode () {
  let self = this
  const convertHeader = function convertHeader(headers) {
    let out = new Headers()
    for (let key of Object.keys(headers)) {
      out.set(key, headers[key])
    }
    return out
  }
  const wrapPort = function wrapPort (port) {
    let curMethod = ''
    let curResolve = null
    let curReject = null
    port.onMessage.addListener(msg => {
      if (msg.method === curMethod) {
        if (msg.err) {
          curReject(msg.err)
        } else {
          curResolve.apply(null, msg.args)
        }
      } else {
        console.error('wtf?')
      }
    })
    return function (method, args) {
      return new Promise((resolve, reject) => {
        curMethod = method
        curResolve = resolve
        curReject = reject
        port.postMessage({
          method: method,
          args: args
        })
      })
    }
  }
  const bgFetch = function bgFetch(...args) {
    const port = wrapPort(chrome.runtime.connect({name: "fetch"}))
    return port('fetch', args).then(r => {
      console.log(r)
      let hasReader = false
      const requireReader = function (after) {
        if (hasReader) {
          return Promise.resolve().then(after)
        } else {
          return port('body.getReader').then(() => hasReader = true).then(after)
        }
      }
      r.json = () => port('json')
      r.headers = convertHeader(r.headers)
      r.body = {
        getReader () {
          return {
            read () {
              return requireReader(() => port('reader.read')).then(r => {
                r.value = new Uint8Array(r.value)
                return r
              })
            },
            cancel () {
              return requireReader(() => port('reader.cancel'))
            }
          }
        }
      }
      return r
    })
  }
  function hookFetch () {
    if (self.fetch !== bgFetch) {
      self.fetch = bgFetch
    }
  }
  const oldBlob = self.Blob
  const newBlob = function newBlob(a, b) {
    a[0] = `(${hookFetchCode})();${a[0]}`
    console.log('new blob', a, b)
    return new oldBlob(a, b)
  }
  if(self.document !== undefined) {
    if (self.Blob !== newBlob) {
      self.Blob = newBlob
    }
  }

  hookFetch()
}
hookFetchCode()