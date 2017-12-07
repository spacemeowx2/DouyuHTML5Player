'use strict'
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  loaders: {
    less: [{
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
