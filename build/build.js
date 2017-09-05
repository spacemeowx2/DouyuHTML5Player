// rollup --environment TARGET:douyu-inject,NODE_ENV=production -c build/config.js
// rollup --environment TARGET:content-script,NODE_ENV=production -c build/config.js
const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const less = require('less')
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
let builds = require('./config').getAllBuilds()

build(builds)

function build (builds) {
  let built = 0
  const total = builds.length
  const next = () => {
    return buildEntry(builds[built]).then(() => {
      built++
      if (built < total) {
        return next()
      }
    })
  }
  const fileList = [
    'src/flash/builtin.abc',
    'src/flash/playerglobal.abc',
    'src/flash/douyu.swf',
    'src/flash/flashemu.js',
    'src/background.js',
    'node_modules/flv.js/dist/flv.min.js'
  ]
  return copy('src/img/*', 'dist/img')
    .then(() => copyEach(fileList, 'dist', {flatten: true}))
    .then(() => read('src/danmu.less'))
    .then(lessSrc => less.render(lessSrc))
    .then(css => write('dist/danmu.css', css.css))
    .then(() => next())
    .catch(logError)
}

function buildEntry (config) {
  return rollup.rollup(config).then(bundle => {
    const code = bundle.generate(config).code
    // const minified = (config.banner ? config.banner + '\n' : '') + uglify.minify(code, {
    //   fromString: true,
    //   output: {
    //     screw_ie8: true,
    //     ascii_only: true
    //   },
    //   compress: {
    //     pure_funcs: null// ['makeMap']
    //   }
    // }).code
    return write(config.dest, code)
  })
}

function write (dest, code) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(dest, code, function (err) {
      if (err) return reject(err)
      console.log(path.relative(process.cwd(), dest) + ' ' + getSize(code))
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

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function logError (e) {
  // console.log(e)
  e.message && console.log(e.message)
  e.stack && console.log(e.stack)
}
