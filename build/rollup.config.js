import vue from 'rollup-plugin-vue'
import copy from 'rollup-plugin-copy'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import replace from 'rollup-plugin-replace'

const debug = process.env.NODE_ENV !== 'production'

const pkg = require('../package.json')
const sites = ['douyu']
const types = ['content', 'inject']
const globals = {
  'vue': 'Vue',
  'vuex': 'Vuex',
  'flash-emu': 'FlashEmu',
  'flv.js': 'flvjs',
}
const commonPlugins = [
  nodeResolve(),
  commonjs(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(debug ? 'debug' : 'production')
  }),
  vue({
    css: true
  }),
  typescript()
]
class SiteConfig {
  constructor (name) {
    this.name = name
  }
  output (type) {
    return {
      format: 'iife',
      file: `dist/js/${this.name}-${type}.js`,
      globals
    }
  }
  plugins (type) {
    return [
      ...commonPlugins,
    ]
  }
  config () {
    return types.map(type => ({
      input: `src/${this.name}/${type}.ts`,
      plugins: this.plugins(type),
      output: this.output(type),
      external: Object.keys(pkg['dependencies']),
    }))
  }
}

function plugins() {
  return [
    ...commonPlugins,
    copy({
      'src/option.html': 'dist/html/option.html',
      'src/flash/builtin.abc': 'dist/builtin.abc',
      'src/flash/playerglobal.abc': 'dist/playerglobal.abc',
      'src/flash/douyu.swf': 'dist/douyu.swf',
      'node_modules/vue/dist/vue.runtime.js': 'dist/js/vue.js',
      'node_modules/vuex/dist/vuex.js': 'dist/js/vuex.js',
      'node_modules/flv.js/dist/flv.min.js': 'dist/js/flv.min.js',
      'node_modules/flash-emu/dist/flashemu.js': 'dist/js/flashemu.js',
      verbose: true
    }),
  ]
}
function background () {
  return {
    input: `src/background.ts`,
    plugins: commonPlugins,
    output: {
      format: 'iife',
      file: `dist/js/background.js`,
      globals
    },
    external: Object.keys(pkg['dependencies']),
  }
}
function option () {
  return {
    input: `src/option.ts`,
    plugins: plugins(),
    output: {
      format: 'iife',
      file: `dist/js/option.js`,
      globals
    },
    external: Object.keys(pkg['dependencies']),
  }
}
export default [...sites.map(name => {
  const site = new SiteConfig(name)
  return site.config()
}).reduce((r, i) => [...r, ...i], []), option(), background()]
