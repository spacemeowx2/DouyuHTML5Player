import '../hookfetch'
import 'flv.js'
import { DanmuPlayer, PlayerUI, PlayerUIEventListener, PlayerState, SizeState } from '../danmuPlayer'
import { bindMenu } from '../playerMenu'
import { DouyuSource, ISignerResult } from './source'
import { getACF } from './api'
import { getURL, addScript, addCss, createBlobURL, onMessage, postMessage, sendMessage, getSetting, setSetting, setBgListener, DelayNotify } from '../utils'
import { TypeState } from 'TypeState'
import { Signer, SignerState } from './signer'
import { getDialog } from '../donate'
import { runtime } from '../chrome'

declare var window: {
  __space_inject: {
    script: string,
    css: string
  },
  [key: string]: any
} & Window
const onload = () => {
if (window.__space_inject) {
  const {script, css} = window.__space_inject
  addCss(createBlobURL(css, 'text/css'))
  addScript(createBlobURL(script, 'text/javascript'))
  window.__space_inject = null
} else {
  addCss('dist/danmu.css')
  addScript('dist/douyuInject.js')
}
// addScript('libs/less.min.js')

const uid = getACF('uid')

flvjs.LoggingControl.forceGlobalTag = true
flvjs.LoggingControl.enableAll = true

class DouyuPlayerUI extends PlayerUI {
  private douyuFullpage = false
  constructor (listener: PlayerUIEventListener, state: TypeState.FiniteStateMachine<PlayerState>) {
    super(listener, state)
    this.wrap.style.position = 'inherit'
    this.wrap.style.zIndex = 'inherit'
  }
  protected _enterFullScreen () {
    this.wrap.style.position = ''
    this.wrap.style.zIndex = ''
    super._enterFullScreen()
  }
  protected _exitFullScreen () {
    this.wrap.style.position = 'inherit'
    this.wrap.style.zIndex = 'inherit'
    super._exitFullScreen()
  }
  protected _enterFullPage () {
    this.wrap.setAttribute('fullpage', '')
    this.el.style.border = '0'
    
    if (!this.douyuFullpage) {
      this.douyuFullpage = true
      postMessage('ACJ', {
        id: 'room_bus_pagescr'
      })
    }
  }
  protected _exitFullPage () {
    this.wrap.removeAttribute('fullpage')
    this.el.style.border = ''

    if (this.douyuFullpage) {
      this.douyuFullpage = false
      postMessage('ACJ', {
        id: 'room_bus_pagescr'
      })
    }
  }
}
class DouyuDanmuPlayer extends DanmuPlayer {
  source: DouyuSource
  constructor (roomId: string) {
    const source = new DouyuSource(roomId, async (rid, tt, did) => {
      let sign = await Signer.sign(roomId, tt, did)
      return sign
    })
    source.onChange = videoUrl => {
      this.src = videoUrl
    }
    super({
      getSrc: () => source.getUrl(),
      onSendDanmu (txt) {
        window.postMessage({
          type: "SENDANMU",
          data: txt
        }, "*")
      }
    })
    this.source = source
  }
  initUI () {
    this.ui = new DouyuPlayerUI(this, this.state)
  }
  onDanmuPkg (pkg: any) {
    if (DEBUG) {
      const example = {
        "type": "chatmsg",
        "rid": "510541",
        "ct": "1", // 酬勤
        "uid": "59839409",
        "nn": "登辛",
        "txt": "3ds没有鼓棒先生吗",
        "cid": "ce554df5bf2841e41459070000000000",
        "ic": "avatar/face/201607/27/12d23d30a9a7790e955d7affc54335ad",
        "level": "17",
        "gt": "2", //
        "rg": "4", //
        "el": "eid@A=1500000005@Setp@A=1@Ssc@A=1@Sef@A=0@S/"
      }
    }
    const getColor = (c: number) => ['#ff0000', '#1e87f0', '#7ac84b', '#ff7f00', '#9b39f4', '#ff69b4'][c-1]
    if (pkg.txt.length > 0) {
      let cls = []
      let color = getColor(pkg.col) || '#ffffff'
      if (pkg.uid === uid) cls.push('danmu-self')
      this.fireDanmu(pkg.txt, color, cls)
    }
  }
}

const makeMenu = (player: DouyuDanmuPlayer, source: DouyuSource) => {
  const cdnMenu = () => source.cdnsWithName.map((i: any) => {
    let suffix = ''
    if (i.cdn == source.cdn) suffix = ' √'
    return {
      text: i.name + suffix,
      cb () {
        source.cdn = i.cdn
      }
    }
  })
  const rateMenu = () => {
    const rates = [{
      text: '超清',
      rate: '0'
    }, {
      text: '高清',
      rate: '2'
    }, {
      text: '普清', 
      rate: '1'
    }]
    return rates.map(i => {
      let suffix = ''
      if (i.rate == source.rate) suffix = ' √'
      return {
        text: i.text + suffix,
        cb () {
          source.rate = i.rate
        }
      }
    })
  }

  const transparentMenu = () => {
    const opts = [{
      text: '0%',
      transparent: 0
    }, {
      text: '25%',
      transparent: 25
    }, {
      text: '50%',
      transparent: 50
    }]
    return [{
      label: '弹幕透明度:'
    }].concat(opts.map(i => {
      let suffix = ''
      if (i.transparent == player.ui.transparent) suffix = ' √'
      return {
        text: i.text + suffix,
        cb () {
          player.ui.transparent = i.transparent
        },
        label: null
      }
    }))
  }
  let mGetURL: (file: string) => string
  if (USERSCRIPT) {
    mGetURL = file => 'https://imspace.nos-eastchina1.126.net/img/' + file
  } else {
    mGetURL = file => getURL('dist/img/' + file)
  }
  const dialog = getDialog('捐赠', '你的支持是我最大的动力.', [{
    src: mGetURL('alipay.png'),
    desc: '支付宝'
  }, {
    src: mGetURL('wechat.png'),
    desc: '微信'
  }])
  const donate = () => {
    return [{
      text: '捐赠',
      cb () {
        document.body.appendChild(dialog)
        dialog.style.display = 'flex'
      }
    }]
  }
  const dash = {}
  bindMenu(player.ui.video, () => [].concat(cdnMenu(), dash, rateMenu(), dash, transparentMenu(), dash, donate()))
}

const loadVideo = (roomId: string, replace: (el: Element) => void) => {
  console.log(1)
  const danmuPlayer = new DouyuDanmuPlayer(roomId)
  console.log(2)

  danmuPlayer.mgr.parsePic = s => s.replace(
    /\[emot:dy(.*?)\]/g,
    (_, i) => `<img style="height:1em" src="https://shark.douyucdn.cn/app/douyu/res/page/room-normal/face/dy${i}.png?v=20161103">`// `<div style="display:inline-block;background-size:1em;width:1em;height:1em;" class="face_${i}"></div>`
  )
  console.log(3)

  replace(danmuPlayer.ui.el)
  console.log(4)

  makeMenu(danmuPlayer, danmuPlayer.source)
  console.log(5)

  window.danmu = danmuPlayer

  return danmuPlayer.source.getUrl().then(() => danmuPlayer)
}


let danmuPlayer: DouyuDanmuPlayer = null
let signerLoaded = new DelayNotify(false)

Signer.init().then(() => true).catch(() => false).then((data: boolean) => {
  console.log('SIGNER_READY', data)
  signerLoaded.notify(data)
})
onMessage('DANMU', data => {
  danmuPlayer && danmuPlayer.onDanmuPkg(data)
})
onMessage('VIDEOID', async data => {
  console.log('onVideoId', data)
  const roomId = data.roomId
  setBgListener(async req => {
    switch (req.type) {
      case 'toggle':
        let setting = await getSetting()
        const id = setting.blacklist.indexOf(roomId)
        if (id === -1) {
          setting.blacklist.push(roomId)
        } else {
          setting.blacklist.splice(id, 1)
        }
        await setSetting(setting)
        location.reload()
    }
  })

  console.log('wait signer')
  if (!await signerLoaded.wait()) {
    console.warn('加载签名程序失败, 无法获取视频地址')
    return
  }

  console.log('start replace')
  try {
    const setting = await getSetting()
    if (setting.blacklist.indexOf(roomId) !== -1) { // 存在黑名单
      if (runtime.sendMessage) {
        runtime.sendMessage({
          type: 'disable'
        })
      }
      return
    }
  } catch (e) {
    console.warn(e)
  }
  let ctr = document.querySelector(`#${data.id}`)
  await postMessage('BEGINAPI', {
    roomId
  })
  danmuPlayer = await loadVideo(roomId, el => {
    ctr.parentNode.replaceChild(el, ctr)
  })
})

}
//document.addEventListener('DOMContentLoaded', onload)
onload()