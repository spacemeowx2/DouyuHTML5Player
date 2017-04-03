//_ACJ_(['room_bus_pagescr']) // 难看的网页全屏
//rlcn
//import './start'
import '../hookfetch'
import 'flv.js'
import { DanmuPlayer, PlayerUI } from '../danmuPlayer'
import { bindMenu } from '../playerMenu'
import { DouyuSource } from './source'
import { getACF } from './api'
import {getURL, addScript, addCss, createBlobURL} from '../utils'

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
  
}
class DouyuDanmuPlayer extends DanmuPlayer {
  source: DouyuSource
  constructor (roomId: string) {
    const source = new DouyuSource(roomId)
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
  }
  initUI () {
    this.ui = new DouyuPlayerUI(this, this.state)
  }
  onDanmuPkg (pkg: any) {
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
    const getColor = (c: number) => ["#ff0000", "#1e87f0", "#7ac84b", "#ff7f00", "#9b39f4", "#ff69b4"][c-1]
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
  const dash = {}
  bindMenu(player.ui.video, () => [].concat(cdnMenu(), dash, rateMenu(), dash, transparentMenu()))
}

const loadVideo = (roomId: string, replace: (el: Element) => void) => {
  const danmuPlayer = new DouyuDanmuPlayer(roomId)

  danmuPlayer.parsePic = s => s.replace(
    /\[emot:dy(.*?)\]/g,
    (_, i) => `<img style="height:1em" src="https://shark.douyucdn.cn/app/douyu/res/page/room-normal/face/dy${i}.png?v=20161103">`// `<div style="display:inline-block;background-size:1em;width:1em;height:1em;" class="face_${i}"></div>`
  )

  replace(danmuPlayer.ui.el)

  makeMenu(danmuPlayer, danmuPlayer.source)

  window.danmu = danmuPlayer

  return danmuPlayer.source.getUrl().then(() => danmuPlayer)
}


let danmuPlayer: DouyuDanmuPlayer = null
window.addEventListener('message', event => {
  if (event.source != window)
    return

  if (event.data.type) {
    const data = event.data.data
    switch (event.data.type) {
      case 'DANMU':
        danmuPlayer && danmuPlayer.onDanmuPkg(data)
        break
      case 'VIDEOID':
        // getRoomId()
        console.log('onVideoId', data)
        let ctr = document.querySelector(`#${data.id}`)
        loadVideo(data.roomId, el => {
          ctr.parentNode.replaceChild(el, ctr)
        }).then(dp => {
          danmuPlayer = dp
        })
        break
    }
  }
}, false)

}
//document.addEventListener('DOMContentLoaded', onload)
onload()