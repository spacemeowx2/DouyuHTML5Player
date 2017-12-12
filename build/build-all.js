// rollup --environment TARGET:douyu-inject,NODE_ENV=production -c build/config.js
// rollup --environment TARGET:content-script,NODE_ENV=production -c build/config.js
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const less = require('less')
const rootPath = path.resolve(__dirname, '..')
// const uglify = require('uglify-js')
const copy = (from, to) => {
  const c = require('copy')
  return new Promise((resolve, reject) => {
    c(from, to, (err, file) => {
      if (err) {
        reject(err)
      } else {
        resolve(file)
      }
    })
  })
}
const copyEach = (from, to, opts) => {
  const c = require('copy')
  return new Promise((resolve, reject) => {
    c.each(from, to, opts, (err, file) => {
      if (err) {
        reject(err)
      } else {
        resolve(file)
      }
    })
  })
}

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

const version = process.env.VERSION || require('../package.json').version

function build (webpackConfig) {
  let built = 0
  const fileList = [
    'src/flash/builtin.abc',
    'src/flash/playerglobal.abc',
    'src/flash/douyu.swf',
    'src/flash/flashemu.js',
    'src/background.js',
    'src/options.html',
    'node_modules/flv.js/dist/flv.min.js',
    'node_modules/vue/dist/vue.runtime.js'
  ]
  return copy('src/img/*', 'dist/img')
    .then(() => copyEach(fileList, 'dist', {flatten: true}))
    .then(() => read('src/danmu.less'))
    .then(lessSrc => less.render(lessSrc))
    .then(css => write('dist/danmu.css', css.css))
    .then(() => webpackBuild(webpackConfig))
    .catch(logError)
}

function webpackBuild (webpackConfig) {
  return new Promise((res, rej) => {
    webpack(webpackConfig, (err, stats) => {
      if (stats.hasErrors()) {
        console.error(stats.compilation.errors)
        rej(new Error('Build failed with errors'))
        return
      }
      const assets = stats.compilation.assets
      for (let key of Object.keys(assets)) {
        const asset = assets[key]
        const rpath = path.relative(rootPath, asset.existsAt)
        console.log(`${rpath} ${getSize(asset.size())}`)
      }
      res()
    })
  })
}

function write (dest, code) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(dest, code, function (err) {
      if (err) return reject(err)
      console.log(path.relative(process.cwd(), dest) + ' ' + getSize(code.length))
      resolve()
    })
  })
}

function read (src) {
  return new Promise((resolve, reject) => {
    fs.readFile(src, 'utf8', (err, data) => {
      if (err) return reject(err)
      resolve(data)
    })
  })
}

function getSize (length) {
  return (length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  // console.log(e)
  e.message && console.log(e.message)
  e.stack && console.log(e.stack)
}

module.exports = build