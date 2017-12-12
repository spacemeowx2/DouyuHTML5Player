'use strict'
const webpack = require('webpack')
const build = require('./build-all')
const baseWebpackConfig = require('./webpack.base.conf')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const merge = require('webpack-merge')

const config = merge(baseWebpackConfig, {
  watch: true,
  watchOptions: {
    ignored: /node_modules/
  },
  stats: 'detailed',
  plugins: [
    new webpack.DefinePlugin({
      'process.env': 'DEBUG'
    }),
    new FriendlyErrorsPlugin()
  ]
})
build(config)
