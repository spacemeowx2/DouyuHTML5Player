import md5 from '../md5'
import {BaseSource} from '../source'
import {stupidMD5} from './blackbox'

async function getSourceURL (rid: string, cdn: string, rate: string) {
  /*
  const API_KEY = 'a2053899224e8a92974c729dceed1cc99b3d8282'
  const tt = Math.round(new Date().getTime() / 60 / 1000)
  const did = md5(Math.random().toString()).toUpperCase()
  const signContent = [rid, did, API_KEY, tt].join('')
  const sign = stupidMD5(signContent)
  let body: any = {
    'cdn': cdn,
    'rate': rate,
    'ver': '2017022801',
    'tt': tt,
    'did': did,
    'sign': sign
  }
  body = Object.keys(body).map(key => `${key}=${encodeURIComponent(body[key])}`).join('&')
  */
  const APPKEY = 'Y237pxTx2In5ayGz';
  const authStr=`room/${rid}?aid=androidhd1&cdn=${cdn}&client_sys=android&time=${new Date().getTime()}`;
  const authmd5 = md5(authStr + APPKEY);  //`https://capi.douyucdn.cn/api/v1/${authstr}&auth=${authmd5}`
  //const res = await fetch(`https://www.douyu.com/lapi/live/getPlay/${rid}`, {
  const res = await fetch(`https://capi.douyucdn.cn/api/v1/${authStr}&auth=${authmd5}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    //body: body
  })
  const videoInfo = await res.json();
  if(videoInfo)return videoInfo;
  return null;
  /*
  const baseUrl = videoInfo.data.rtmp_url
  const livePath = videoInfo.data.rtmp_live
  if (baseUrl && livePath) {
    const videoUrl = `${baseUrl}/${livePath}`
    //console.log('RoomId', rid, 'SourceURL:', videoUrl,'hls_url:',videoInfo.data.hls_url)
    return videoUrl
  } else {
    throw new Error('未开播或获取失败')
  }
  */
}

async function getSwfApi (rid: string) {
  const API_KEY = '22222'
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
  constructor (roomId: string) {
    super()
    this._cdn = 'ws';
    this._rate = '0';
    this.url = null;
    this.roomId = roomId;
    this.swfApi = null;
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
      return this.swfApi.data.cdnsWithName;
    } else {
      return [{
        name: '主要线路',
        cdn: 'ws'
      },{
          name: '线路二',
          cdn: 'ws2'
      },{
          name: '线路三',
          cdn: 'tct'
      },{
          name: '线路五',
          cdn: 'dl'
      }];
    }
  }
  async getUrl () {
    /*
    if (!this.swfApi) {
      this.swfApi = await getSwfApi(this.roomId)
      this._cdn = this.swfApi.cdns[0]
    }*/
    this.swfApi = await getSourceURL(this.roomId, this.cdn, this.rate);
    if(this.swfApi) {
        if (this.swfApi.data.show_status === "1") {
            const baseUrl = this.swfApi.data.rtmp_url
            const livePath = this.swfApi.data.rtmp_live
            if (baseUrl && livePath) {
              this.url=`${baseUrl}/${livePath}`;
            }
        }
    }
    return this.url;
  }
}