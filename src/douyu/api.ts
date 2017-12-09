import {p32, u32, postMessage, utf8_to_ascii, ascii_to_utf8} from '../utils'
import {JSocket, Handlers} from '../JSocket'
import md5 from '../md5'

declare var window: {
  _ACJ_ (args: any[]): void,
  [key: string]: any
} & Window
declare function escape(s:string): string;

export const getACF = (key: string) => {
  try {
    return new RegExp(`acf_${key}=(.*?);`).exec(document.cookie)[1]
  } catch (e) {
    return ''
  }
}

interface DouyuPackage {
  type: string,
  [key: string]: any
}
function filterEnc (s: string) {
  s = s.toString()
  s = s.replace(/@/g, '@A')
  return s.replace(/\//g, '@S')
}
function filterDec (s: string) {
  s = s.toString()
  s = s.replace(/@S/g, '/')
  return s.replace(/@A/g, '@')
}
function douyuEncode (data: DouyuPackage) {
  return Object.keys(data).map(key => `${key}@=${filterEnc(data[key])}`).join('/') + '/'
}
function douyuDecode (data: string) {
  let out: DouyuPackage = {
    type: '!!missing!!'
  }
  try {
    data.split('/').filter(i => i.length > 2).forEach(i => {
      let e = i.split('@=')
      out[e[0]] = filterDec(e[1])
    })
  } catch (e) {
    console.error(e)
    console.log(data)
  }
  return out
}
function douyuDecodeList (list: string) {
  return list.split('/').filter(i => i.length > 2).map(filterDec).map(douyuDecode)
}
export function ACJ (id: string, data: any | string) {
  if (typeof data == 'object') {
    data = douyuEncode(data)
  }
  try {
    window._ACJ_([id, data])
  } catch (e) {
    console.error(id, data, e)
  }
}

interface DouyuListener {
  onPackage (pkg: DouyuPackage, pkgStr: string): void
  onClose (): void
  onError (e: string): void
}
class DouyuProtocol extends JSocket implements Handlers {
  buffer: string
  connectHandler: () => void = () => null
  constructor (public listener: DouyuListener) {
    super()
    this.init(this, {})
    this.buffer = ''
  }
  connectAsync (host: string, port: number) {
    super.connect(host, port)
    return new Promise<void>((res, rej) => {
      const prevConnHandler = this.connectHandler
      const prevErrHandler = this.errorHandler
      const recover = () => {
        this.connectHandler = prevConnHandler
        this.errorHandler = prevErrHandler
      }
      this.connectHandler = () => {
        recover()
        res()
      }
      this.errorHandler = () => {
        recover()
        rej()
      }
    })
  }
  dataHandler (data: string) {
    this.buffer += data
    let buffer = this.buffer
    while (buffer.length >= 4) {
      let size = u32(buffer.substr(0, 4))
      if (buffer.length >= size) {
        let pkgStr = ''
        try {
          pkgStr = ascii_to_utf8(buffer.substr(12, size-8))
        } catch (e) {
          console.log('deocde fail', escape(buffer.substr(12, size-8)))
        }
        this.buffer = buffer = buffer.substr(size+4)
        if (pkgStr.length === 0) continue
        try {
          let pkg = douyuDecode(pkgStr)
          this.listener && this.listener.onPackage(pkg, pkgStr)
        } catch (e) {
          console.error('call map', e)
        }
      } else {
        break
      }
    }
  }
  closeHandler () {
    console.error('lost connection')
    this.listener && this.listener.onClose()
  }
  errorHandler (err: string) {
    console.error(err)
    this.listener && this.listener.onError(err)
  }
  send (data: DouyuPackage) {
    let msg = douyuEncode(data) + '\0'
    msg = utf8_to_ascii(msg)
    msg = p32(msg.length+8) + p32(msg.length+8) + p32(689) + msg
    this.writeFlush(msg)
  }
}
function Type (type: string) {
  return (target: {
    map: { [key: string]: Function },
    [key: string]: any
  }, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!target.map) {
      target.map = {}
    }
    target.map[type] = target[propertyKey]
  }
}

class DouyuBaseClient implements DouyuListener {
  private prot: DouyuProtocol
  private lastIP: string = null
  private lastPort: number = null
  private keepaliveId: number = null
  redirect: {
    [key: string]: string
  } = {}
  map: {
    [key: string]: Function
  }
  static getRoomArgs () {
    if (window._room_args) return window._room_args
    if (window.room_args) {
      return window.room_args
    } else {
      return window.$ROOM.args
    }
  }
  async reconnect () {
    console.log('reconnect')
    this.prot.listener = null
    this.prot = new DouyuProtocol(this)
    try {
      await this.connectAsync(this.lastIP, this.lastPort)
    } catch (e) {
      // 连接失败
      this.onError()
    }
  }
  onClose () {
    setTimeout(() => this.reconnect(), 1000)
  }
  onError () {
    this.onClose()
  }
  onPackage (pkg: DouyuPackage, pkgStr: string) {
    const type = pkg.type
    if (this.redirect[type]) {
      ACJ(this.redirect[type], pkg)
      return
    }
    if (this.map[type]) {
      this.map[type].call(this, pkg, pkgStr)
      return
    }
    this.onDefault(pkg)
  }
  onDefault (pkg: DouyuPackage) {

  }
  send (pkg: DouyuPackage) {
    this.prot.send(pkg)
  }
  async connectAsync (ip: string, port: number) {
    this.lastIP = ip
    this.lastPort = port
    await this.prot.connectAsync(ip, port)
    this.send(this.loginreq())
  }
  keepalivePkg (): DouyuPackage {
    return {
      type: 'keeplive',
      tick: Math.round(new Date().getTime() / 1000).toString()
    }
  }
  loginreq () {
    const rt = Math.round(new Date().getTime() / 1000)
    const devid = getACF('devid') // md5(Math.random()).toUpperCase()
    const username = getACF('username')
    console.log('username', username, devid)
    return {
      type: 'loginreq',
      username: username,
      ct: 0,
      password: '',
      roomid: this.roomId,
      devid: devid,
      rt: rt,
      vk: md5(`${rt}r5*^5;}2#\${XF[h+;'./.Q'1;,-]f'p[${devid}`),
      ver: '20150929',
      aver: '2017012111',
      biz: getACF('biz'),
      stk: getACF('stk'),
      ltkid: getACF('ltkid')
    }
  }
  startKeepalive () {
    this.send(this.keepalivePkg())
    if (this.keepaliveId) {
      clearInterval(this.keepaliveId)
    }
    this.keepaliveId = setInterval(() => this.send(this.keepalivePkg()), 30 * 1000)
  }
  constructor (public roomId: string) {
    this.prot = new DouyuProtocol(this)
  }
}

let blacklist: string[] = []
function onChatMsg (data: DouyuPackage) {
  if (blacklist.indexOf(data.uid) !== -1) {
    console.log('black')
    return
  }
  try {
    postMessage('DANMU', data)
  } catch (e) {
    console.error('wtf', e)
  }
  ACJ('room_data_chat2', data)
  if (window.BarrageReturn) {
    window.BarrageReturn(douyuEncode(data))
  }
}
class DouyuClient extends DouyuBaseClient {
  uid: string
  constructor (roomId: string, public danmuClient: DouyuDanmuClient) {
    super(roomId)
    this.redirect = {
      qtlr: 'room_data_tasklis',
      initcl: 'room_data_chatinit',
      memberinfores: 'room_data_info',
      ranklist: 'room_data_cqrank',
      rsm: 'room_data_brocast',
      qausrespond: 'data_rank_score',
      frank: 'room_data_handler',
      online_noble_list: 'room_data_handler',
    }
  }
  reqOnlineGift (loginres: DouyuPackage) {
    return {
      type: 'reqog',
      uid: loginres.userid
    }
  }
  @Type('chatmsg')
  chatmsg (data: DouyuPackage) {
    // onChatMsg(data)
  }
  @Type('resog')
  resog (data: DouyuPackage) {
    ACJ('room_data_chest', {
      lev: data.lv,
      lack_time: data.t,
      dl: data.dl
    })
  }
  @Type('loginres')
  loginres (data: DouyuPackage) {
    console.log('loginres ms', data)
    this.uid = data.userid
    this.send(this.reqOnlineGift(data))
    this.startKeepalive()
    ACJ('room_data_login', data)
    ACJ('room_data_getdid', {
      devid: getACF('devid')
    })
  }
  @Type('keeplive')
  keeplive (data: DouyuPackage, rawString: string) {
    ACJ('room_data_userc', data.uc)
    ACJ('room_data_tbredpacket', rawString)
  }
  @Type('setmsggroup')
  setmsggroup (data: DouyuPackage) {
    console.log('joingroup', data)
    this.danmuClient.send({
      type: 'joingroup',
      rid: data.rid,
      gid: data.gid
    })
  }
  onDefault (data: DouyuPackage) {
    ACJ('room_data_handler', data)
    console.log('ms', data)
  }
}

class DouyuDanmuClient extends DouyuBaseClient {
  constructor (roomId: string) {
    super(roomId)
    this.redirect = {
      chatres: 'room_data_chat2',
      initcl: 'room_data_chatinit',
      dgb: 'room_data_giftbat1',
      dgn: 'room_data_giftbat1',
      spbc: 'room_data_giftbat1',
      uenter: 'room_data_nstip2',
      upgrade: 'room_data_ulgrow',
      newblackres: 'room_data_sys',
      ranklist: 'room_data_cqrank',
      rankup: 'room_data_ulgrow',
      gift_title: 'room_data_schat',
      rss: 'room_data_state',
      srres: 'room_data_wbsharesuc',
      onlinegift: 'room_data_olyw',
      gpbc: 'room_data_handler',
      synexp: 'room_data_handler',
      frank: 'room_data_handler',
      ggbb: 'room_data_sabonusget',
      online_noble_list: 'room_data_handler',
    }
  }
  @Type('chatmsg')
  chatmsg (pkg: DouyuPackage) {
    onChatMsg(pkg)
  }
  @Type('loginres')
  loginres (data: DouyuPackage) {
    console.log('loginres dm', data)
    this.startKeepalive()
  }
  onDefault (data: DouyuPackage) {
    ACJ('room_data_handler', data)
    console.log('dm', data)
  }
}

function hookDouyu (roomId: string, miscClient: DouyuClient) {
  let oldExe: Function
  const repeatPacket = (text: string) => douyuDecode(text)
  const jsMap: any = {
    js_getRankScore: repeatPacket,
    js_getnoble: repeatPacket,
    js_rewardList: {
      type: 'qrl',
      rid: roomId
    },
    js_queryTask: {
      type: 'qtlnq'
    },
    js_newQueryTask: {
      type: 'qtlq'
    },
    js_sendmsg (msg: string) {
      let pkg = douyuDecode(msg)
      pkg.type = 'chatmessage'
      return pkg
    },
    js_giveGift (gift: string) {
      let pkg = douyuDecode(gift)
      if (pkg.type === 'dn_s_gf') {
        pkg.type = 'sgq'
        pkg.bat = 0
      }
      console.log('giveGift', gift)
      return gift
    },
    js_GetHongbao: repeatPacket,
    js_UserHaveHandle () {},
    js_myblacklist (list: string) {
      console.log('add blacklist', list)
      blacklist = list.split('|')
    },
    js_medal_opera (opt: string) {
      let pkg = douyuDecode(opt)
      return pkg
    }
  }
  const api: any = window['require']('douyu/page/room/base/api')
  const hookd = function hookd (...args: any[]) {
    let req = jsMap[args[0]]
    if (req) {
      if (typeof req == 'function') {
        req = req.apply(null, args.slice(1))
      }
      req && miscClient.send(req)
    } else {
      console.log('exe', args)
      try {
        return oldExe.apply(api, args)
      } catch (e) {}
    }
  }
  if (api) {
    if (api.exe !== hookd) {
      oldExe = api.exe
      api.exe = hookd
    }
  } else if (window.thisMovie) {
    window.thisMovie = () => new Proxy({}, {
      get (target: any, key: PropertyKey, receiver: any) {
        return (...args: any[]) => hookd.apply(null, [key].concat(args))
      }
    })
  }
}

export interface DouyuAPI {
  sendDanmu (content: string): void
  serverSend (pkg: DouyuPackage): void
  hookExe (): void
}
export async function douyuApi (roomId: string): Promise<DouyuAPI> {
  const res = await fetch('/swf_api/get_room_args')
  const args = await res.json()
  const servers = JSON.parse(decodeURIComponent(args.server_config))
  const mserver = servers[Math.floor(Math.random() * servers.length)]
  const ports = [8601, 8602, 12601, 12602]
  const danmuServer = {
    ip: 'danmu.douyu.com',
    port: ports[Math.floor(Math.random() * ports.length)]
  }

  let danmuClient = new DouyuDanmuClient(roomId)
  let miscClient = new DouyuClient(roomId, danmuClient)
  await danmuClient.connectAsync(danmuServer.ip, danmuServer.port)
  await miscClient.connectAsync(mserver.ip, mserver.port)
  return {
    sendDanmu (content: string) {
      miscClient.send({
        col: '0',
        content: content,
        dy: '',
        pid: '',
        sender: miscClient.uid,
        type: 'chatmessage'
      })
    },
    serverSend (pkg: DouyuPackage) {
      return miscClient.send(pkg)
    },
    hookExe () {
      hookDouyu(roomId, miscClient)
    }
  }
}
