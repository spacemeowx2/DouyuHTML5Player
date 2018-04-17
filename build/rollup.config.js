import vue from 'rollup-plugin-vue'
import copy from 'rollup-plugin-copy'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'
import replace from 'rollup-plugin-replace'

const debug = process.env.NODE_ENV !== 'production'

const pkg = require('../package.json')
const sites = ['douyu']
const types = ['content', 'inject']
const globals = {
  'vue': 'Vue',
  'vuex': 'Vuex'
}
const commonPlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify(debug ? 'debug' : 'production')
  }),
  vue({
    css: true
  }),
  nodeResolve(),
  typescript({
    typescript: require('typescript')
  })
]
class SiteConfig {
  constructor (name) {
    this.name = name
  }
  output (type) {
    return {
      format: 'umd',
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
      'node_modules/vue/dist/vue.runtime.js': 'dist/js/vue.js',
      'node_modules/vuex/dist/vuex.js': 'dist/js/vuex.js',
      'node_modules/flv.js/dist/flv.js': 'dist/js/flv.js',
      verbose: true
    }),
  ]
}
function option () {
  return {
    input: `src/option.ts`,
    plugins: plugins(),
    output: {
      format: 'umd',
      file: `dist/js/option.js`,
      globals
    },
    external: Object.keys(pkg['dependencies']),
  }
}

export default sites.map(name => {
  const site = new SiteConfig(name)
  return site.config()
}).reduce((r, i) => r.concat(i), []).concat(...[option()])