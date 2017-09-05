const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const path = require('path')
const typescript = require('rollup-plugin-typescript')
const replace = require('rollup-plugin-replace')

const sites = ['douyu']
let builds = {}
sites.forEach(site => {
  builds[`${site}-cs`] = () => genConfig({
    entry: path.resolve(__dirname, `../src/${site}/contentScript.ts`),
    dest: path.resolve(__dirname, `../dist/${site}CS.js`),
    format: 'umd'
  })
  builds[`${site}-inject`] = () => genConfig({
    entry: path.resolve(__dirname, `../src/${site}/inject.ts`),
    dest: path.resolve(__dirname, `../dist/${site}Inject.js`),
    format: 'umd'
  })
})

function genConfig (opts) {
  if (!process.env.REPLACE) {
    process.env.REPLACE = JSON.stringify({
      DEBUG: JSON.stringify(false),
      USERSCRIPT: JSON.stringify(false)
    })
  }
  opts.plugins = [
    replace(JSON.parse(process.env.REPLACE)),
    nodeResolve({
      skip: ['flv.js'],
      extensions: ['.ts', '.js']
    }),
    commonjs(),
    typescript({
      typescript: require('typescript')
    })
  ]
  opts.context = 'window'
  opts.globals = {
    'flv.js': 'flvjs'
  }
  opts.indent = '  '
  return opts
}

if (process.env.TARGET) {
  module.exports = builds[process.env.TARGET]()
} else {
  exports.getAllBuilds = () => Object.keys(builds).map(name => builds[name]())
  exports.builds = builds
}
