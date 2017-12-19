'use strict'
const webpack = require('webpack')
const build = require('./build-all')
const baseWebpackConfig = require('./webpack.base.conf')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const merge = require('webpack-merge')

const config = merge(baseWebpackConfig, {
  plugins: [
    new webpack.DefinePlugin({
      'process.env': 'PRODUCTION'
    }),
    new FriendlyErrorsPlugin()
  ]
})
build(config)
