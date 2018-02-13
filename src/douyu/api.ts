import {p32, u32, postMessage, utf8_to_ascii, ascii_to_utf8, randInt, delay, DelayNotify, LocalStorage} from '../utils'
import {JSocket, Handlers} from '../JSocket'
import md5 from '../md5'
const storage = new LocalStorage('h5plr')
const PUREMODE = 'pureMode'

export function isPureMode () {
  return storage.getItem(PUREMODE, '0') === '1'
}

export function setPureMode (val: boolean) {
  storage.setItem(PUREMODE, val ? '1' : '0')
}

declare var window: {
  _ACJ_ (args: any[]): void,
  [key: string]: any
} & Window
declare function escape(s:string): string;

export const getACF = (key: string) => {
  try {
    return new RegExp(`acf_${key}=(.*?)(;|$)`).exec(document.cookie)[1]
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
function abConcat(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
  let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
  tmp.set(new Uint8Array(buffer1), 0)
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
  return tmp.buffer
};

interface DouyuListener {
  onReconnect (): void
  onPackage (pkg: DouyuPackage, pkgStr: string): void
  onClose (): void
  onError (e: string): void
}

class DouyuProtocol {
  buffer: ArrayBuffer
  connectHandler: () => void = () => null
  ws: WebSocket
  decoder = new TextDecoder('utf-8')
  encoder = new TextEncoder('utf-8')
  constructor (public listener: DouyuListener) {
    this.buffer = new ArrayBuffer(0)
  }
  connectAsync (url: string) {
    return new Promise<void>((res, rej) => {
      const ws = new WebSocket(url)
      ws.binaryType = 'arraybuffer'
      ws.onopen = () => {
        this.ws = ws
        ws.onmessage = e => {
          const buf: ArrayBuffer = e.data
          this.dataHandler(buf)
        }
        ws.onclose = () => this.closeHandler()
        ws.onerror = (e) => this.errorHandler('Connection error(ws)')
        res()
      }
      ws.onerror = () => rej()
    })
  }
  dataHandler (data: ArrayBuffer) {
    this.buffer = abConcat(this.buffer, data)
    while (this.buffer.byteLength >= 4) {
      const buffer = this.buffer
      const view = new DataView(buffer)
      let size = view.getUint32(0, true)
      if (buffer.byteLength - 4 >= size) {
        const u8 = new Uint8Array(buffer)
        let pkgStr = ''
        try {
          pkgStr = this.decoder.decode(u8.slice(12, 4 + size - 1))
          // pkgStr = ascii_to_utf8(buffer.substr(12, size-8))
        } catch (e) {
          console.log('decode fail', u8)
        }
        this.buffer = u8.slice(size + 4).buffer
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
    let msg = douyuEncode(data)
    let msgu8 = this.encoder.encode(msg)
    msgu8 = new Uint8Array(abConcat(msgu8.buffer, new ArrayBuffer(1)))

    let buf = new ArrayBuffer(msgu8.length + 12)
    const headerView = new DataView(buf)
    const hLen = msgu8.length + 8
    headerView.setUint32(0, hLen, true)
    headerView.setUint32(4, hLen, true)
    headerView.setUint32(8, 689, true)

    new Uint8Array(buf).set(msgu8, 12)
    this.ws.send(buf)
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

abstract class DouyuBaseClient implements DouyuListener {
  private prot: DouyuProtocol
  private lastIP: string = null
  private lastPort: string = null
  private keepaliveId: number = null
  private reconnectDelay: number = 1000
  private queue = Promise.resolve()
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
      this.onReconnect()
    } catch (e) {
      // 连接失败
      this.onError()
    }
  }
  onClose () {
    setTimeout(() => this.reconnect(), this.reconnectDelay)
    if (this.reconnectDelay < 16000) {
      this.reconnectDelay *= 2
    }
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
      this.queue = this.queue.then(() => this.map[type].call(this, pkg, pkgStr))
      return
    }
    this.onDefault(pkg)
  }
  abstract onDefault (pkg: DouyuPackage): void
  abstract onReconnect (): void
  send (pkg: DouyuPackage) {
    this.prot.send(pkg)
  }
  async connectAsync (ip: string, port: string) {
    this.lastIP = ip
    this.lastPort = port
    const url = `wss://${ip}:${port}/`
    await this.prot.connectAsync(url)
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
    const devid = getACF('did') // md5(Math.random()).toUpperCase()
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
      pt: 2,
      vk: md5(`${rt}r5*^5;}2#\${XF[h+;'./.Q'1;,-]f'p[${devid}`),
      ver: '20150929',
      aver: 'H5_2018021001beta',
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
  rg: number
  pg: number
  danmuClient: DouyuDanmuClient
  serverList: {
    ip: string,
    port: string,
    nr: string
  }[]
  constructor (roomId: string) {
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
    if (this.rg > 1 || this.pg > 1) {
      return
    }
    onChatMsg(data)
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
    this.rg = data.roomgroup
    this.pg = data.pg
    this.send(this.reqOnlineGift(data))
    this.startKeepalive()
    ACJ('room_data_login', data)
    ACJ('room_data_getdid', {
      devid: getACF('devid')
    })
  }
  @Type('msgrepeaterproxylist')
  async msgrepeaterproxylist (data: DouyuPackage) {
    this.serverList = douyuDecodeList(data.list) as any
    if (this.danmuClient !== undefined) {
      console.warn('skip connect dm')
      return
    }
    const list = this.serverList
    const serverAddr = list[randInt(0, list.length)]
    this.danmuClient = new DouyuDanmuClient(this.roomId)
    window.dm = this.danmuClient
    await this.danmuClient.connectAsync(serverAddr.ip, serverAddr.port)
  }
  @Type('keeplive')
  keeplive (data: DouyuPackage, rawString: string) {
    ACJ('room_data_userc', data.uc)
    ACJ('room_data_tbredpacket', rawString)
  }
  @Type('setmsggroup')
  setmsggroup (data: DouyuPackage) {
    console.log('joingroup', data)
    this.danmuClient.joingroup(data.rid, data.gid)
  }
  onDefault (data: DouyuPackage) {
    ACJ('room_data_handler', data)
    console.log('ms', data.type, data)
  }
  onReconnect () {

  }
}

class DouyuDanmuClient extends DouyuBaseClient {
  gid: string
  rid: string
  hasReconnect: boolean = false
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
  joingroup (rid: string, gid: string) {
    this.rid = rid
    this.gid = gid
    this.send({
      type: 'joingroup',
      rid: rid,
      gid: gid
    })
  }
  @Type('chatmsg')
  chatmsg (pkg: DouyuPackage) {
    onChatMsg(pkg)
  }
  @Type('loginres')
  loginres (data: DouyuPackage) {
    console.log('loginres dm', data)
    this.startKeepalive()
    if (this.hasReconnect) {
      this.hasReconnect = false
      if (this.rid && this.gid) {
        this.joingroup(this.rid, this.gid)
      }
    }
  }
  onDefault (data: DouyuPackage) {
    ACJ('room_data_handler', data)
    console.log('dm', data.type, data)
  }
  onReconnect () {
    this.hasReconnect = true
  }
}

function hookDouyu (roomId: string, miscClient: DouyuClient, loginNotify: DelayNotify<void>) {
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
    if (args[0] == 'js_userlogin') {
      console.log('user login')
      loginNotify.notify(undefined)
    }
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
}
export async function douyuApi (roomId: string): Promise<DouyuAPI> {
  ACJ('room_bus_login', '')
  const res = await fetch('/swf_api/getProxyServer')
  const args = await res.json()
  const servers = args.servers
  const mserver = servers[Math.floor(Math.random() * servers.length)]

  let miscClient = new DouyuClient(roomId)
  const df = new DelayNotify<void>(undefined)
  hookDouyu(roomId, miscClient, df)
  await df.wait()
  await miscClient.connectAsync(mserver.ip, mserver.port)
  return {
    sendDanmu (content: string) {
      // type@=chatmessage/receiver@=0/content@=${内容}/scope@=/col@=0/pid@=/p2p@=0/nc@=0/rev@=0/hg@=0/ifs@=0/sid@=/lid@=0/
      miscClient.send({
        nc: '0',
        rev: '0',
        hg: '0',
        ifs: '0',
        lid: '0',
        col: '0',
        p2p: '0',
        receiver: '0',
        content: content,
        sid: '',
        pid: '',
        scope: '',
        type: 'chatmessage'
      })
    },
    serverSend (pkg: DouyuPackage) {
      return miscClient.send(pkg)
    }
  }
}
