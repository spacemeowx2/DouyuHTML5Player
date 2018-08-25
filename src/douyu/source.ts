import md5 from 'utils/md5'
import { ISignerResult } from './source'
import { runtimePort } from 'utils/port'
import { BaseSource, RateKey } from 'common/source'

const port = runtimePort('signer')
async function BackgroundSigner (rid: string, tt: number, did: string): Promise<ISignerResult> {
  return (await port('sign', rid, tt, did)) as any
}

export interface ISignerResult {
  cptl: string,
  sign: string
}
type SignFunc = (rid: string, tt: number, did: string) => Promise<ISignerResult>
let m_signer: SignFunc = BackgroundSigner

export async function getSourceURL (rid: string, cdn: string, rate: string) {
  const tt = Math.round(new Date().getTime() / 60 / 1000)
  const did = md5(Math.random().toString()).toUpperCase()
  if (m_signer === null) {
    throw new Error('Signer is not defined.')
  }
  const sign: ISignerResult = await m_signer(rid, tt, did)
  let body: any = {
    'cdn': cdn,
    'rate': rate,
    'ver': 'Douyu_h5_2017080201beta',
    'tt': tt,
    'did': did,
    'sign': sign.sign,
    'cptl': sign.cptl,
    'ct': 'webh5'
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
  const res = await fetch(`https://www.douyu.com/swf_api/room/${rid}?cdn=&nofan=yes&_t=${tt}&sign=${sign}`)
  const obj = await res.json()
  return await obj.data
}

export class Source extends BaseSource {
  constructor () {
    super([{
      key: 'cdn',
      display: '线路'
    }, {
      key: RateKey,
      display: '清晰度',
      subOptions: [{
        key: '0',
        display: '超清'
      }, {
        key: '2',
        display: '高清'
      }, {
        key: '1',
        display: '普清'
      }]
    }])
  }
  async init () {
    
  }
}
