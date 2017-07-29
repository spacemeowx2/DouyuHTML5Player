import md5 from '../md5'
import {BaseSource} from '../source'

type SignFunc = (rid: string, tt: number, did: string) => Promise<string>;
let m_signer: SignFunc = null

async function getSourceURL (rid: string, cdn: string, rate: string) {
  const API_KEY = 'a2053899224e8a92974c729dceed1cc99b3d8282'
  const tt = Math.round(new Date().getTime() / 60 / 1000)
  const did = md5(Math.random().toString()).toUpperCase()
  // const signContent = [rid, did, API_KEY, tt].join('')
  // const sign = stupidMD5(signContent)
  if (m_signer === null) {
    throw new Error('Signer is not defined.')
  }
  const sign = await m_signer(rid, tt, did)
  let body: any = {
    'cdn': cdn,
    'rate': rate,
    'ver': '2017072601',
    'tt': tt,
    'did': did,
    'sign': sign,
    'cptl': '0001'
  }
  body = Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&')
  const res = await fetch(`https://www.douyu.com/lapi/live/getPlay/${rid}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body
  })
  const videoInfo = await res.json()
  const baseUrl = videoInfo.data.rtmp_url
  const livePath = videoInfo.data.rtmp_live
  if (baseUrl && livePath) {
    const videoUrl = `${baseUrl}/${livePath}`
    console.log('RoomId', rid, 'SourceURL:', videoUrl)
    return videoUrl
  } else {
    throw new Error('未开播或获取失败')
  }
}

async function getSwfApi (rid: string) {
  const API_KEY = 'bLFlashflowlad92'
  const tt = Math.round(new Date().getTime() / 60 / 1000)
  const signContent = [rid, API_KEY, tt].join('')
  const sign = md5(signContent)
  const res = await fetch(`http://www.douyutv.com/swf_api/room/${rid}?cdn=&nofan=yes&_t=${tt}&sign=${sign}`)
  const obj = await res.json()
  return await obj.data
}

export class DouyuSource extends BaseSource {
  roomId: string
  swfApi: any
  private _cdn: string
  private _rate: string
  constructor (roomId: string, signer: SignFunc) {
    super()
    m_signer = signer
    this._cdn = 'ws'
    this._rate = '0'
    this.url = ''
    this.roomId = roomId
    this.swfApi = null
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
  async getUrl () {
    if (!this.swfApi) {
      this.swfApi = await getSwfApi(this.roomId)
      this._cdn = this.swfApi.cdns[0]
    }
    let url = await getSourceURL(this.roomId, this.cdn, this.rate)
    this.url = url
    return url
  }
}