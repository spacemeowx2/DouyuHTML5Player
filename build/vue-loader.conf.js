'use strict'
const isProduction = process.env.NODE_ENV === 'production'
const cssLoader = {
  loader: 'css-loader',
  options: {
    minimize: process.env.NODE_ENV === 'production',
    sourceMap: false
  }
}
module.exports = {
  loaders: {
    less: [cssLoader, {
      loader: 'less-loader'
    }]
  },
  transformToRequire: {
    video: 'src',
    source: 'src',
    img: 'src',
    image: 'xlink:href'
  }
}
