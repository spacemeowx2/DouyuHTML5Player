import { utf8_to_ascii, ascii_to_utf8 } from '../utf8helper'
import JSocket from '../JSocket'
import md5 from 'md5'

const p32 = i => [i, i / 256, i / 65536, i / 16777216].map(i => String.fromCharCode(Math.floor(i) % 256)).join('')
const u32 = s => s.split('').map(i => i.charCodeAt(0)).reduce((a, b) => b * 256 + a)

function ACJ (id, data) {
  if (typeof data == 'object') {
    data = douyuClient.douyuEncode(data)
  }
  try {
    _ACJ_([id, data])
  } catch (e) {
    console.error(id, data, e)
  }
}
export const getACF = key => {
  try {
    return new RegExp(`acf_${key}=(.*?);`).exec(document.cookie)[1]
  } catch (e) {
    return ''
  }
}
export const getRoomId = () => {
  let rid
  try {
    return /rid=(\d+)/.exec(document.querySelector('.feedback-report-button').href)[1]
  } catch (e) {}
  try {
    rid = document.querySelector('.current').getAttribute('data-room_id')
    if (rid) {
      return rid
    }
  } catch (e) {}
  try {
    rid = /"room_id":(\d+)/.exec(document.head.innerHTML)[1]
    if (rid !== '0') {
      return rid
    }
  } catch (e) {}
  try {
    rid = /room_id=(\d+)/.exec(document.head.innerHTML)[1]
    if (rid !== '0') {
      return rid
    }
  } catch (e) {}
  throw new Error('未找到RoomId')
}

class douyuClient {
  connectHandler () {}
  dataHandler (data) {
    this.buffer += data
    let buffer = this.buffer
    let map = this.map
    while (buffer.length >= 4) {
      let size = u32(buffer.substr(0, 4))
      if (buffer.length >= size) {
        let pkg = ''
        try {
          pkg = ascii_to_utf8(buffer.substr(12, size-8))
        } catch (e) {
          console.log('deocde fail', escape(buffer.substr(12, size-8)))
        }
        this.buffer = buffer = buffer.substr(size+4)
        if (pkg.length === 0) continue
        try {
          const rawString = pkg
          const caller = (func) => func(pkg, data => this.send(data), {
            ACJ: ACJ,
            rawString: rawString,
            decode: douyuClient.douyuDecode,
            encode: douyuClient.douyuEncode
          })
          pkg = douyuClient.douyuDecode(pkg)
          if (map) {
            let cb = map[pkg.type]
            if (cb) {
              if (typeof cb == 'string') {
                ACJ(cb, pkg)
              } else {
                caller(map[pkg.type])
              }
            } else {
              map.default && caller(map.default)
            }
          }
        } catch (e) {
          console.error('call map', e)
        }
      } else {
        break
      }
    }
  }
  constructor () {
    this.map = {}
    this.buffer = ''
    this.socket = new JSocket({
      connectHandler: () => this.connectHandler(),
      dataHandler: (data) => this.dataHandler(data),
      closeHandler: () => this.closeHandler(),
      errorHandler: () => this.errorHandler()
    })
    // let oldSend = this.send
    // this.send = data => oldSend(data)
  }
  connect (ip, port) {
    this.socket.connect(ip, port)
  }
  static filterEnc (s) {
    s = s.toString()
    s = s.replace(/@/g, '@A')
    return s.replace(/\//g, '@S')
  }
  static filterDec (s) {
    s = s.toString()
    s = s.replace(/@S/g, '/')
    return s.replace(/@A/g, '@')
  }
  static douyuEncode (data) {
    return Object.keys(data).map(key => `${key}@=${douyuClient.filterEnc(data[key])}`).join('/') + '/'
  }
  static douyuDecode (data) {
    let out = {}
    data.split('/').filter(i => i.length > 2).some(i => {
      let e = i.split('@=')
      out[e[0]] = douyuClient.filterDec(e[1])
    })
    return out
  }
  static encode (data) {
    return douyuClient.douyuEncode(data)
  }
  static decode (data) {
    return douyuClient.douyuDecode(data)
  }
  static decodeList (list) {
    return list = list.split('/').filter(i => i.length > 2).map(douyuClient.filterDec).map(douyuClient.douyuDecode)
  }
  closeHandler () {
    console.error('lost connection')
  }
  errorHandler (errorstr) {
    console.error(errorstr);
  }
  send (data) {
    let msg = douyuClient.douyuEncode(data) + '\0'
    msg = utf8_to_ascii(msg)
    msg = p32(msg.length+8) + p32(msg.length+8) + p32(689) + msg
    this.socket.writeFlush(msg)
  }
}

let douyuApi = function (roomId) {
  console.log('douyu api', roomId)
  let _room_args = null
  let blacklist = []
  let danmuServer = new douyuClient()
  let miscServer = new douyuClient()

  const getRoomArgs = () => {
    if (_room_args) return _room_args
    if (window.room_args) {
      return window.room_args
    } else {
      return $ROOM.args
    }
  }
  const randServer = () => {
    const servers = JSON.parse(decodeURIComponent(getRoomArgs().server_config))
    const i = Math.floor(Math.random() * servers.length)
    return servers[i]
  }
  const randDanmuServer = () => {
    const ports = [8601, 8602, 12601, 12602]
    const i = Math.floor(Math.random() * ports.length)
    return {
      ip: 'danmu.douyu.com',
      // ip: '211.91.140.131',
      port: ports[i]
    }
  }

  const loginreq = () => {
    const rt = Math.round(new Date().getTime() / 1000)
    const devid = getACF('devid') // md5(Math.random()).toUpperCase()
    const username = getACF('username')
    console.log('username', username, devid)
    return {
      type: 'loginreq',
      username: username,
      ct: 0,
      password: '',
      roomid: roomId,
      devid: devid,
      rt: rt,
      vk: md5(`${rt}7oE9nPEG9xXV69phU31FYCLUagKeYtsF${devid}`),
      ver: '2016102501',
      biz: getACF('biz'),
      stk: getACF('stk'),
      ltkid: getACF('ltkid')
    }
  }
  const keepalive = () => {
    return {
      type: 'keeplive',
      tick: Math.round(new Date().getTime() / 1000)
    }
  }
  const reqOnlineGift = (loginres) => {
    return {
      type: 'reqog',
      uid: loginres.userid
    }
  }
  const onchatmsg = (data, send, {ACJ, encode}) => {
    if (blacklist.includes(data.uid)) {
      console.log('black')
      return
    }
    try {
      window.postMsg({
        type: "DANMU",
        data: data
      }, "*")
    } catch (e) {
      console.error('wtf', e)
    }
    ACJ('room_data_chat2', data)
    if (window.BarrageReturn) {
      window.BarrageReturn(encode(data))
    }
  }

  miscServer.map = {
    chatmsg: onchatmsg,
    qtlr: 'room_data_tasklis',
    initcl: 'room_data_chatinit',
    memberinfores: 'room_data_info',
    ranklist: 'room_data_cqrank',
    rsm: 'room_data_brocast',
    qausrespond: 'data_rank_score',
    resog (data, send, {ACJ}) {
      // lev@=1/lack_time[t]@=0/dl@=2/
      ACJ('room_data_chest', {
        lev: data.lv,
        lack_time: data.t,
        dl: data.dl
      })
    },
    loginres (data, send, {ACJ}) {
      console.log('loginres', data)
      send(reqOnlineGift(data))
      send(keepalive())
      setInterval(() => send(keepalive()), 30*1000)
      ACJ('room_data_login', data)
      ACJ('room_data_getdid', {
        devid: getACF('devid')
      })
    },
    keeplive (data, send, {ACJ, rawString}) {
      ACJ('room_data_userc', data.uc)
      ACJ('room_data_tbredpacket', rawString)
    },
    setmsggroup (data, send) {
      danmuServer.send({
        type: 'joingroup',
        rid: data.rid,
        gid: data.gid
      })
    },
    default (data, send, {ACJ}) {
      ACJ('room_data_handler', data)
      console.log('ms', data)
    }
  }
  
  danmuServer.map = {
    chatmsg: onchatmsg,
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
    // ggbr: '',
    default (data, send, {ACJ}) {
      ACJ('room_data_handler', data)
      console.log('dm', data)
    }
  }

  miscServer.connectHandler = () => {
    miscServer.send(loginreq())
  }
  danmuServer.connectHandler = () => {
    danmuServer.send(loginreq())
    setInterval(() => danmuServer.send(keepalive()), 30*1000)
  }

  return fetch('/swf_api/get_room_args').then(r => r.json()).then(args => {
    _room_args = args
  }).then(() => {
    let server = randServer()
    miscServer.connect(server.ip, server.port)
    server = randDanmuServer()
    danmuServer.connect(server.ip, server.port)
    const repeatPacket = text => douyuClient.decode(text)
    const jsMap = {
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
      js_getRankScore: repeatPacket,
      js_sendmsg (msg) {
        msg = douyuClient.decode(msg)
        msg.type = 'chatmessage'
        return msg
      },
      js_giveGift (gift) {
        gift = douyuClient.decode(gift)
        if (gift.type === 'dn_s_gf') {
          gift.type = 'sgq'
          gift.bat = 0
        }
        console.log('giveGift', gift)
        return gift
      },
      js_GetHongbao: repeatPacket,
      js_UserHaveHandle () {},
      js_myblacklist (list) {
        console.log('add blacklist', list)
        blacklist = list.split('|')
      }
    }


    return {
      hookExe () {
        const api = require('douyu/page/room/base/api')
        const hookd = function hookd (...args) {
          let req = jsMap[args[0]]
          if (req) {
            if (typeof req == 'function') {
              req = req.apply(null, args.slice(1))
            }
            req && miscServer.send(req)
          } else {
            console.log('exe', args)
            try {
              return oldExe.apply(api, args)
            } catch (e) {}
          }
        }
        if (api) {
          let oldExe = api.exe
          if (oldExe !== hookd) {
            api.exe = hookd
          }
        } else if (window.thisMovie) {
          window.thisMovie = () => new Proxy({}, {
            get (target, key, receiver) {
              return (...args) => hookd.apply(null, [key].concat(args))
            },
            set (target, key, receiver) {
            }
          })
        }
      },
      sendDanmu (content) {
        miscServer.send({
          col: '0',
          content: content,
          dy: '',
          pid: '',
          sender: '702735', //TODO uid
          type: 'chatmessage'
        })
      },
      serverSend (c) {
        return miscServer.send(c)
      },
      roomId: roomId
    }
  })
}

export {
  douyuClient,
  douyuApi
}