//rlcn
import '../hookfetch'
import 'flv.js'
const flvjs = window.flvjs
import { DanmuPlayerControls, DanmuPlayer } from '../danmuPlayer'
import { DouyuSource } from '../douyuSource'
import { getACF, getRoomId } from '../douyuApi'
import { bindMenu } from '../playerMenu'

function addScript (src) {
  var script = document.createElement('script')
  script.src = chrome.runtime.getURL(src)
  document.head.appendChild(script)
}
function addCss (src, rel, type) {
  var link = document.createElement('link')
  link.rel = rel || 'stylesheet'
  link.type = type || 'text/css'
  link.href = chrome.runtime.getURL(src)
  document.head.appendChild(link)
}
// addCss('src/danmu.less', 'stylesheet/less', 'text/css')
addCss('dist/danmu.css')
addScript('dist/douyuInject.js')
// addScript('libs/less.min.js')

const uid = getACF('uid')

flvjs.LoggingControl.forceGlobalTag = true
flvjs.LoggingControl.enableAll = true

const makeMenu = (el, source) => {
  const cdnMenu = () => source.cdnsWithName.map(i => {
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
  bindMenu(el, () => [].concat(cdnMenu(), rateMenu()))
}

const loadVideo = (roomId, replace) => {
    const source = new DouyuSource(roomId)
    const danmuPlayer = new DanmuPlayer(new DanmuPlayerControls({
      onReload: () => source.getUrl(),
      onSendDanmu (txt) {
        window.postMessage({
          type: "SENDANMU",
          data: txt
        }, "*")
      }
    }), pkg => pkg.uid == uid)

    source.onChange = videoUrl => {
      danmuPlayer.src = videoUrl
    }
    danmuPlayer.parsePic = s => s.replace(
      /\[emot:dy(.*?)\]/g,
      (_, i) => `<img style="height:1em" src="https://shark.douyucdn.cn/app/douyu/res/page/room-normal/face/dy${i}.png?v=20161103">`// `<div style="display:inline-block;background-size:1em;width:1em;height:1em;" class="face_${i}"></div>`
    )

    let roomVideo = document.querySelector('#js-room-video')
    if (!roomVideo) {
      roomVideo = document.querySelector('.live_site_player_container')
    }

    roomVideo.removeChild(roomVideo.children[0])
    roomVideo.insertBefore(danmuPlayer.el, roomVideo.children[0])

    makeMenu(danmuPlayer.video, source)

    window.danmu = danmuPlayer

    return source.getUrl().then(() => danmuPlayer)
}

loadVideo(getRoomId()).then(danmuPlayer => {
  window.addEventListener('message', event => {
    if (event.source != window)
      return

    if (event.data.type && (event.data.type == "DANMU")) {
      const data = event.data.data
      danmuPlayer.onDanmu(data)
    }
  }, false)
})
