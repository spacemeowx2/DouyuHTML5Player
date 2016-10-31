function douyuClient (ip, port, map) {
  function utf8_to_ascii( str ) {
    return unescape(encodeURIComponent(str))
  }
  function ascii_to_utf8( str ) {
    return decodeURIComponent(escape(str))
  }
  function filterEnc (s) {
    s = s.toString()
    s = s.replace(/@/g, '@A')
    return s.replace(/\//g, '@S')
  }
  function filterDec (s) {
    s = s.toString()
    s = s.replace(/@S/g, '/')
    return s.replace(/@A/g, '@')
  }
  function douyuEncode (data) {
    return Object.keys(data).map(key => `${key}@=${filterEnc(data[key])}`).join('/') + '/'
  }
  function douyuDecode (data) {
    let out = {}
    data.split('/').filter(i => i.length > 2).some(i => {
      let e = i.split('@=')
      out[e[0]] = filterDec(e[1])
    })
    return out
  }
  function decodeList (list) {
    return list = list.split('/').filter(i => i.length > 2).map(filterDec).map(douyuDecode)
  }
  douyuClient.encode = douyuEncode
  douyuClient.decode = douyuDecode
  douyuClient.decodeList = decodeList
  const ACJ = (id, data) => {
    if (typeof data == 'object') {
      data = douyuEncode(data)
    }
    _ACJ_([id, data])
  }
  function closeHandler() {
    console.error('lost connection')
  }
  function errorHandler(errorstr) {
    console.error(errorstr);
  }
  const p32 = i => [i, i / 256, i / 65536, i / 16777216].map(i => String.fromCharCode(Math.floor(i) % 256)).join('')
  const u32 = s => s.split('').map(i => i.charCodeAt(0)).reduce((a, b) => b * 256 + a)
  return new Promise((resolve, reject) => {
    let send = null
    let buffer = ''
    let bufLen = 0
    let socket = new JSocket({
      connectHandler () {
        resolve(send)
      },
      dataHandler (data) {
        buffer += data
        while (buffer.length >= 4) {
          let size = u32(buffer.substr(0, 4))
          if (buffer.length >= size) {
            let pkg = ''
            try {
              pkg = ascii_to_utf8(buffer.substr(12, size-8))
            } catch (e) {
              console.log('deocde fail')
            }
            buffer = buffer.substr(size+4)
            if (pkg.length === 0) continue
            try {
              const rawString = pkg
              pkg = douyuDecode(pkg)
              if (map) {
                let cb = map[pkg.type]
                if (cb) {
                  if (typeof cb == 'string') {
                    ACJ(cb, pkg)
                  } else {
                    map[pkg.type](pkg, send, {
                      ACJ: ACJ,
                      rawString: rawString,
                      decode: douyuDecode,
                      encode: douyuEncode
                    })
                  }
                } else {
                  map.default && map.default(pkg, send)
                }
              }
            } catch (e) {}
          } else {
            break
          }
        }
      },
      closeHandler: closeHandler,
      errorHandler: errorHandler
    })
    socket.connect(ip, port)
    send = function send (data) {
      let msg = douyuEncode(data) + '\0'
      msg = utf8_to_ascii(msg)
      msg = p32(msg.length+8) + p32(msg.length+8) + p32(689) + msg
      socket.writeFlush(msg)
    }
  })
}
//////////////////////////////////////////////////////////////////////////////////
let _room_args = null
let douyuApi = function douyuApi (roomId) {
  console.log('douyu api', roomId)
  let blacklist = []
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
  const getACF = key => {
    try {
      return new RegExp(`acf_${key}=(.*?);`).exec(document.cookie)[1]
    } catch (e) {
      return ''
    }
  }
  const loginreq = () => {
    const rt = Math.round(new Date().getTime() / 1000)
    const devid = getACF('did') // md5(Math.random()).toUpperCase()
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
  let server = randServer()
  let serverSend
  let danmuSend
  douyuClient(server.ip, server.port, {
    initcl: 'room_data_chatinit',
    memberinfores: 'room_data_info',
    ranklist: 'room_data_cqrank',
    rsm: 'room_data_brocast',
    loginres (data, send, {ACJ}) {
      send(keepalive())
      setInterval(() => send(keepalive()), 30*1000)
      ACJ('room_data_login', data)
      ACJ('room_data_getdid', {
        devid: getACF('did')
      })
    },
    keeplive (data, send, {ACJ, rawString}) {
      ACJ('room_data_userc', data.uc)
      ACJ('room_data_tbredpacket', rawString)
    },
    setmsggroup (data, send) {
      danmuSend({
        type: 'joingroup',
        rid: data.rid,
        gid: data.gid
      })
    },
    default (data, send, {ACJ}) {
      ACJ('room_data_handler', data)
      console.log('ms', data)
    }
  }).then(send => {
    send(loginreq())
    serverSend = send
  })
  server = randDanmuServer()
  // 
  douyuClient(server.ip, server.port, {
    chatmsg (data, send, {ACJ, encode}) {
      if (blacklist.includes(data.uid)) {
        console.log('black')
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
    },
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
  }).then(send => {
    send(loginreq())
    setInterval(() => send(keepalive()), 30*1000)
    danmuSend = send
  })
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
      /*
        type: sgq
        gfid=289
        num=1
        bat=0
      */
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
          req && serverSend(req)
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
      serverSend({
        col: '0',
        content: content,
        dy: '',
        pid: '',
        sender: '702735',
        type: 'chatmessage'
      })
    }
  }
}

fetch('/swf_api/get_room_args').then(r => r.json()).then(args => {
  _room_args = args
  window.douyuApi = douyuApi
})