import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
const path = require('path')

const builds = {
  'content-script': {
    entry: path.resolve(__dirname, '../src/entries/contentScript.js'),
    dest: path.resolve(__dirname, '../dist/contentScript.js'),
    format: 'umd'
  },
  'douyu-inject': {
    entry: path.resolve(__dirname, '../src/entries/douyuInject.js'),
    dest: path.resolve(__dirname, '../dist/douyuInject.js'),
    plugins: [
      nodeResolve(),
      commonjs()
    ],
    format: 'umd'
  }
}

if (process.env.TARGET) {
  module.exports = builds[process.env.TARGET]
} else {
  module.exports = builds
}
