import md5 from 'md5'
import {stupidMD5} from './blackbox'

function getSourceURL (rid, cdn, rate) {
  const API_KEY = 'a2053899224e8a92974c729dceed1cc99b3d8282'
  const tt = Math.round(new Date().getTime() / 60 / 1000)
  const did = md5(Math.random().toString()).toUpperCase()
  const signContent = [rid, did, API_KEY, tt].join('')
  const sign = stupidMD5(signContent)
  let body = {
    'cdn': cdn,
    'rate': rate,
    'ver': '2017022801',
    'tt': tt,
    'did': did,
    'sign': sign
  }
  body = Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&')
  return fetch(`https://www.douyu.com/lapi/live/getPlay/${rid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  })
  .then(res => res.json())
  .then(videoInfo => {
    const baseUrl = videoInfo.data.rtmp_url
    const livePath = videoInfo.data.rtmp_live
    if (baseUrl && livePath) {
      const videoUrl = `${baseUrl}/${livePath}`
      console.log('RoomId', rid, 'SourceURL:', videoUrl)
      return videoUrl
    } else {
      throw new Error('未开播或获取失败')
    }
  })
}

const getSwfApi = (rid) => {
  const API_KEY = 'bLFlashflowlad92'
  const tt = Math.round(new Date().getTime() / 60 / 1000)
  const signContent = [rid, API_KEY, tt].join('')
  const sign = md5(signContent)
  return fetch(`http://www.douyutv.com/swf_api/room/${rid}?cdn=&nofan=yes&_t=${tt}&sign=${sign}`)
  .then(res => res.json())
  .then(r => r.data)
}

export class DouyuSource {
  constructor (roomId) {
    this._cdn = 'ws'
    this._rate = '0'
    this.url = ''
    this.roomId = roomId
    this.swfApi = null
    this.onChange = () => null
  }
  set cdn (val) {
    this._cdn = val
    this.getUrl()
  }
  get cdn () {
    return this._cdn
  }
  set rate (val) {
    this._rate = val
    this.getUrl()
  }
  get rate () {
    return this._rate
  }
  get cdnsWithName () {
    if (this.swfApi) {
      return this.swfApi.cdnsWithName
    } else {
      return [{
        name: '主要线路',
        cdn: 'ws'
      }]
    }
  }
  getUrl () {
    let chain = Promise.resolve()
    if (!this.swfApi) {
      chain = chain.then(() => getSwfApi(this.roomId)).then(swfApi => {
        this.swfApi = swfApi
        this._cdn = swfApi.cdns[0]
      })
    }
    chain = chain.then(() => getSourceURL(this.roomId, this.cdn, this.rate))
      .then(url => {
        this.url = url
        this.onChange(url)
        return url
      })
    return chain
  }
}