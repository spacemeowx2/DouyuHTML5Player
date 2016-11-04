const nodeResolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const buble = require('rollup-plugin-buble')
const path = require('path')

const builds = {
  'content-script': () => genConfig({
    entry: path.resolve(__dirname, '../src/entries/contentScript.js'),
    dest: path.resolve(__dirname, '../dist/contentScript.js'),
    format: 'umd'
  }),
  'douyu-inject': () => genConfig({
    entry: path.resolve(__dirname, '../src/entries/douyuInject.js'),
    dest: path.resolve(__dirname, '../dist/douyuInject.js'),
    format: 'umd'
  })
}

function genConfig(opts) {
  opts.plugins = [
    nodeResolve(),
    commonjs(),
    buble({
      transforms: {
        dangerousForOf: true
      }
    })
  ]
  return opts
}

if (process.env.TARGET) {
  module.exports = builds[process.env.TARGET]()
} else {
  exports.getAllBuilds = () => Object.keys(builds).map(name => builds[name]())
  exports.builds = builds
}
