var fs = require('fs')
var path = require('path')
var archiver = require('archiver')

function base64 (str) {
  return new Buffer(str).toString('base64')
}
function embedURLToCSS (base, css) {
  return css.replace(/url\((.*?)\)/g, (m, url) => {
    const content = fs.readFileSync(path.join(base, url), {
      encoding: 'utf-8'
    })
    return `url(data:image/svg+xml;base64,${encodeURIComponent(base64(content))})`
  })
}
function makeUserScript (manifest) {
  let { matches, run_at, js } = manifest.content_scripts[0]
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
// @namespace http://imspace.cn/gms
// @run-at ${run_at}
// @version ${manifest.version}
// @grant GM_xmlhttpRequest
${matches}
// ==/UserScript==`
  const read = file => fs.readFileSync(file, {
    encoding: 'utf-8'
  })
  const wrapString = str => {
    str = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
    return str.split('\n').map(s => `"${ s.replace(/\r/g, '\\r') }\\n"`).join('+\r\n')
    // `"${ str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') }"`
  }
  let script = wrapString(read('./dist/douyuInject.js'))
  let css = wrapString(embedURLToCSS('./dist', read('./dist/danmu.css')))
  let jsContent = [
    metadata,
    overrideXHR,
    `window.__space_inject = {script: ${script}, css: ${css}};`,
    read(js[0])
    ].join('\r\n')
  fs.writeFileSync(`versions/${manifest.version}.user.js`, jsContent)
}

// 同步manifest的版本
console.log('sync version...')
var package = require('../package')
var manifest = fs.readFileSync('manifest.json', {
  encoding: 'utf-8'
})
manifest = manifest.replace(/("version"\s*:\s*)"(\d+\.\d+\.\d+)"/, function (_, v) {
  return v + '"' + package.version + '"';
})
fs.writeFileSync('manifest.json', manifest)

// 压缩成zip
function zip(manifest, filename) {
  console.log('ziping...', manifest)
  try {fs.mkdirSync('versions')} catch (e) {}
  var archive = archiver.create('zip', {})
  var output = fs.createWriteStream(filename)
  var zipDirs = ['dist']
  var zipFiles = ['icon.png']

  archive.pipe(output)

  zipDirs.forEach(function (dir) {
    archive.directory(dir, dir)
  })
  zipFiles.forEach(function (file) {
    archive.file(file)
  })
  archive.file(manifest, {
    name: 'manifest.json'
  })
  archive.finalize()
}

zip('manifest.json', 'versions/dh5p-'+package.version+'.zip')
makeUserScript(JSON.parse(manifest))
