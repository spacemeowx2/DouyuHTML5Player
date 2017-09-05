const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const projectRoot = path.resolve(__dirname, '../')

const manifest = fs.readFileSync('manifest.json', {
  encoding: 'utf-8'
})
build().then(files => {
  makeUserScript(files, JSON.parse(manifest))
})

function build () {
  process.env.REPLACE = JSON.stringify({
    DEBUG: JSON.stringify(false),
    USERSCRIPT: JSON.stringify(true)
  })
  const builds = require('./config').getAllBuilds()
  const total = builds.length
  let built = 0
  let out = {}
  const next = () => {
    const config = builds[built]
    return rollup.rollup(config)
      .then(bundle => {
        const code = bundle.generate(config).code
        out[path.relative(projectRoot, config.dest)] = code
      })
      .then(() => {
        built++
        if (built < total) {
          return next()
        }
      })
  }
  return next().then(() => out)
}
function base64 (str) {
  return Buffer.from(str).toString('base64')
}
function embedURLToCSS (base, css) {
  return css.replace(/url\((.*?)\)/g, (m, url) => {
    const content = fs.readFileSync(path.join(base, url), {
      encoding: 'utf-8'
    })
    return `url(data:image/svg+xml;base64,${encodeURIComponent(base64(content))})`
  })
}
function makeUserScript (files, manifest) {
  let { matches, runAt, js } = manifest.content_scripts[0]
  matches = matches.map(i => `// @match ${i}`).join('\r\n')
  const hostRoot = 'https://ojiju7xvu.qnssl.com/d5hp'
  const overrideXHR = `
class GMXMLHttpRequest {
  constructor () {
    this.config = {
      headers: {}
    }
    this.xhr = null
  }
  open (method, url) {
    this.config.method = method
    this.config.url = url
  }
  send () {
    for (let key of Object.keys(this)) {
      if (key === 'config') continue
      if (key.substr(0, 2) === 'on') {
        this.config[key] = this.wrapper(this[key])
      } else {
        this.config[key] = this[key]
      }
    }
    this.xhr = GM_xmlhttpRequest(this.config)
  }
  setRequestHeader (key, value) {
    this.config.headers[key] = value
  }
  abort () {
    this.xhr && this.xhr.abort()
  }
  wrapper (func) {
    return e => {
      e.target = this.xhr
      if (e.response) {
        e.target.response = e.response
      }
      func(e)
    }
  }
  get status () {
    return this.xhr ? this.xhr.status : 0
  }
  get readyState () {
    return this.xhr ? this.xhr.readyState : 0
  }
}
window.fetch = function (url, config) {
  let conf = {}
  Object.assign(conf, config || { method: 'GET' })
  conf.url = url
  conf.data = config ? config.body : null
  return new Promise((resolve, reject) => {
    conf.onload = (response) => {
      if (response.status === 200) {
        resolve({
          json () {
            return Promise.resolve(JSON.parse(response.responseText))
          }
        })
      } else {
        reject(response)
      }
    }
    GM_xmlhttpRequest(conf)
  })
}
window.XMLHttpRequest = GMXMLHttpRequest`
  const metadata = `// ==UserScript==
// @description ${manifest.description}
// @downloadURL ${hostRoot}/latest.user.js
// @icon ${hostRoot}/icon.png
// @name ${manifest.name}
// @require https://cdn.bootcss.com/flv.js/1.3.0/flv.min.js
// @namespace http://imspace.cn/gms
// @run-at ${runAt}
// @version ${manifest.version}
// @grant GM_xmlhttpRequest
${matches}
// ==/UserScript==`
  const read = file => fs.readFileSync(file, {
    encoding: 'utf-8'
  })
  const readFromFiles = file => files[path.relative(projectRoot, path.resolve(file))]
  const wrapString = str => {
    str = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return str.split('\n').map(s => `"${s.replace(/\r/g, '\\r')}\\n"`).join('+\r\n')
  }
  let script = wrapString(readFromFiles('./dist/douyuInject.js'))
  let css = wrapString(embedURLToCSS('./dist', read('./dist/danmu.css')))
  let jsContent = [
    metadata,
    overrideXHR,
    `window.__space_inject = {script: ${script}, css: ${css}};`,
    readFromFiles(js[js.length - 1])
  ].join('\r\n')
  fs.writeFileSync(`versions/${manifest.version}.user.js`, jsContent)
}
