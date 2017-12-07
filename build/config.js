const path = require('path')
const webpackConfig = require('./webpack.base.conf')
const sites = ['douyu']
let builds = {}
sites.forEach(site => {
  builds[`${site}-cs`] = () => genConfig(
    `${site}/contentScript.ts`,
    `${site}CS.js`,
    {}
  )
  builds[`${site}-inject`] = () => genConfig(
    `${site}/inject.ts`,
    `${site}Inject.js`,
    {}
  )
})

function genConfig (input, output, opts) {
  const entry = path.resolve(__dirname, '../src/', input)
  if (!process.env.REPLACE) {
    process.env.REPLACE = JSON.stringify({
      DEBUG: JSON.stringify(false)
    })
  }
  let options = Object.assign({}, webpackConfig, opts)
  options.entry.app = entry
  options.output.filename = output
  return options
}

if (process.env.TARGET) {
  module.exports = builds[process.env.TARGET]()
} else {
  exports.getAllBuilds = () => Object.keys(builds).map(name => builds[name]())
  exports.builds = builds
}
