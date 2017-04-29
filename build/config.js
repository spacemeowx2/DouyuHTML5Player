const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const buble = require('rollup-plugin-buble')
const path = require('path')
const typescript = require('rollup-plugin-typescript')

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

function genConfig(opts) {
  opts.plugins = [
    nodeResolve({
      skip: ['flv.js'],
      extensions: ['.ts', '.js']
    }),
    commonjs(),
    typescript({
      typescript: require('typescript')
    }),
    buble({
      transforms: {
        dangerousForOf: true
      }
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
