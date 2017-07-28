import '../hookfetch'
import 'flv.js'
import { DanmuPlayer, PlayerUI, PlayerUIEventListener, PlayerState, SizeState } from '../danmuPlayer'
import { bindMenu } from '../playerMenu'
import { DouyuSource } from './source'
import { getACF } from './api'
import {
    getURL, addScript, addCss, LocalStorage, createBlobURL, onMessage, postMessage, sendMessage, getSetting,
    setSetting, setBgListener, addCORsScript
} from '../utils'
import { TypeState } from 'TypeState'
const storage = new LocalStorage('h5plr')

g_maxRow=parseInt(storage.getItem("maxDanmuRows","15"));
g_bIsShowingInfo = false;

declare let window: {
  __space_inject: {
    script: string,
    css: string
  },
  [key: string]: any
} & Window
const onload = () => {
if (window.__space_inject) {
  const {script, css} = window.__space_inject;
  addCss(createBlobURL(css, 'text/css'));
  addScript(createBlobURL(script, 'text/javascript'));
  window.__space_inject = null;
} else {
    addCss('dist/danmu.css');
    addScript('dist/douyuInject.js');
    //addScript('dist/responsivevoice.js');
    //addCORsScript("https://code.responsivevoice.org/responsivevoice.js");
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
    const source = new DouyuSource(roomId)
    source.onChange = videoUrl => {
      this.src = videoUrl
    }
    super({
      getSrc: () => source.getUrl(),
      onSendDanmu (txt,col) {
        window.postMessage({
          type: "SENDANMU",
          data: [txt,col]
        }, "*")
      }
    })
    this.source = source
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
    const getColor = (c: number) => [["#ff0000","#ffffff",7], ["#1e87f0","#ffffff",2], ["#7ac84b","#ff7f00",3], ["#ff7f00","#7ac84b",5], ["#9b39f4","#7ac84b",6], ["#ff69b4","#000000",4]][c-1]
    if (pkg.txt.length > 0) {
      let n = getColor(pkg.col) || ['#ffffff','#000000',1]
      this.fireDanmu(pkg.txt, n[0], n[1], n[2], pkg.uid === uid)
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
    }, {
      text: '75%',
      transparent: 75
    }, {
      text: '95%',
      transparent: 95
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

  const danmuRowsMenu=()=>{
      const rws=[{
        text:'极少',
        rows:15
      },{
        text:'普通',
        rows:25
      },{
        text:'偏多',
        rows:35
      },{
        text:'极多',
        rows:43
      }]
      return[{
        label:'弹幕显示区域大小：'
      }].concat(rws.map(i=>{
        let suffix = ''
        if (i.rows === g_maxRow) suffix = ' √';
        return {
          text:i.text+suffix,
          cb(){
            g_maxRow=i.rows;
            storage.setItem("maxDanmuRows",i.rows.toString());
          },
          label:null
        }
      }))
  }

  const dash = {}
  bindMenu(player.ui.video, () => [].concat(cdnMenu(), dash, rateMenu(), dash, danmuRowsMenu(),dash,transparentMenu()))
}

const loadVideo = (roomId: string, replace: (el: Element) => void) => {
  const danmuPlayer = new DouyuDanmuPlayer(roomId)

  danmuPlayer.mgr.parsePic = s => s.replace(
    /\[emot:dy(.*?)\]/g,
    (_, i) => `<img style="height:1em" src="https://shark.douyucdn.cn/app/douyu/res/page/room-normal/face/dy${i}.png?v=20161103">`// `<div style="display:inline-block;background-size:1em;width:1em;height:1em;" class="face_${i}"></div>`
  )

  replace(danmuPlayer.ui.el)

  makeMenu(danmuPlayer, danmuPlayer.source)

  window.danmu = danmuPlayer

  return danmuPlayer.source.getUrl().then(() => danmuPlayer)
}


let danmuPlayer: DouyuDanmuPlayer = null

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
  try {
    const setting = await getSetting()
    if (setting.blacklist.indexOf(roomId) !== -1) { // 存在黑名单
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
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