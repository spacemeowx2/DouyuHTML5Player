const emptyFunc = () => null
const requestFullScreen = () => {
  var de = document.documentElement;
  if (de.requestFullscreen) {
    de.requestFullscreen();
  } else if (de.mozRequestFullScreen) {
    de.mozRequestFullScreen();
  } else if (de.webkitRequestFullScreen) {
    de.webkitRequestFullScreen();
  }
}
function exitFullscreen() {
  var de = document;
  if (de.exitFullscreen) {
    de.exitFullscreen();
  } else if (de.mozCancelFullScreen) {
    de.mozCancelFullScreen();
  } else if (de.webkitCancelFullScreen) {
    de.webkitCancelFullScreen();
  }
}
function DanmuPlayerControls (listener) {
  this.onPause = emptyFunc
  this.onPlay = emptyFunc
  this.onReload = emptyFunc
  this.onVolume = emptyFunc
  Object.keys(listener).forEach(key => this[key] = listener[key])
}

function DanmuPlayer (controls, isSelf) {
  const poolSize = 100
  const playerContainer = document.createElement('div')
  const playerWrap = document.createElement('div')
  const playerCtrl = document.createElement('div')
  const danmuLayout = document.createElement('div')
  const videoBox = document.createElement('div')
  const videoBoxBox = document.createElement('div')
  const videoEl = document.createElement('video')

  videoEl.style.width = videoEl.style.height = '100%'

  videoBox.className = 'danmu-video'
  playerCtrl.className = 'danmu-ctrl'
  danmuLayout.className = 'danmu-layout'
  playerWrap.className = 'danmu-wrap'
  playerContainer.className = 'danmu-container'

  videoBox.appendChild(videoEl)
  playerWrap.appendChild(videoBox)
  playerWrap.appendChild(playerCtrl)
  playerWrap.appendChild(danmuLayout)
  playerContainer.appendChild(playerWrap)

  playerWrap.addEventListener('mousemove', event => {
    const hoverCtl = event.path.indexOf(playerCtrl) !== -1
    if (event.offsetY - playerWrap.lastY == 0) return
    playerWrap.lastY = event.offsetY
    let height = playerWrap.getBoundingClientRect().height
    if (event.offsetY > 0) {
      playerWrap.setAttribute('hover', '')
      if (this._moveId) clearTimeout(this._moveId)
      if (!hoverCtl) this._moveId = setTimeout(() => playerWrap.removeAttribute('hover'), 1000)
    } else {
      playerWrap.removeAttribute('hover')
    }
  })

  this.parsePic = i => i
  this.isSelf = isSelf || emptyFunc
  this.controls = controls
  this.video = videoEl
  this.el = playerContainer
  this.wrap = playerWrap
  this.dmLayout = danmuLayout
  this.curDanmu = []
  this.pool = []
  this.rows = []
  this.baseTop = 10
  this.maxRow = 10
  this.deferTime = 0 // 暂停时间
  this.deferQueue = []
  this.hideDanmu = false
  this.playing = true
  this.muted = false
  for (let i = 0; i < poolSize; i++) {
    let dm = document.createElement('div')
    dm.using = false
    danmuLayout.appendChild(dm)
    this.pool.push(dm)
  }
  this.initControls(playerCtrl)
}

DanmuPlayer.prototype.createVolume = function createVolume (cb) {
  const volume = document.createElement('div')
  const progress = document.createElement('div')
  const input = document.createElement('input')
  volume.className = 'danmu-volume'
  progress.className = 'progress'
  input.type = 'range'
  volume.appendChild(input)
  volume.appendChild(progress)

  input.value = localStorage.getItem('volume') || '100'
  input.addEventListener('input', event => {
    progress.style.width = `${input.value}%`
    cb(input.value / 100)
    localStorage.setItem('volume', input.value)
  })
  progress.style.width = `${input.value}%`
  return volume
}

DanmuPlayer.prototype.initControls = function initControls (bar) {
  const now = () => new Date().getTime()
  const addBtn = (cls, cb) => {
    const btn = document.createElement('div')
    btn.className = ['danmu-btn', 'danmu-'+cls].join(' ')
    btn.addEventListener('click', cb)
    bar.appendChild(btn)
    return btn
  }
  this.video.addEventListener('dblclick', event => {
    this.onFullpage()
    event.preventDefault()
    event.stopPropagation()
  })
  let beginTime = 0
  const playPause = addBtn('playpause', () => {
    this.playing = !this.playing
    if (this.playing) {
      this.deferTime += now() - beginTime
      this.controls.onPlay()
      playPause.setAttribute('pause', '')
    } else {
      beginTime = now()
      this.controls.onPause()
      playPause.removeAttribute('pause')
    }
  })
  playPause.setAttribute('pause', '')
  
  const reload = addBtn('reload', () => {
    this.deferTime = 0
    this.controls.onReload()
  })

  const fullscreen = addBtn('fullscreen', () => {
    this.onFullpage(true)
  })

  const fullpage = addBtn('fullpage', () => {
    this.onFullpage()
  })

  const volume = this.createVolume(percent => {
    // volume
    this.controls.onVolume(percent)
  })
  bar.appendChild(volume)

  let lastVolume;
  const mute = addBtn('mute', () => {
    this.muted = !this.muted
    if (this.muted) {
      lastVolume = this.controls.onVolume()
      this.controls.onVolume(0)
      mute.setAttribute('muted', '')
    } else {
      this.controls.onVolume(lastVolume)
      mute.removeAttribute('muted')
    }
  })

  const danmuSwitch = addBtn('switch', () => {
    this.hideDanmu = !this.hideDanmu
    danmuSwitch.innerText = this.hideDanmu ? '开启弹幕' : '关闭弹幕'
    this.dmLayout.style.display = this.hideDanmu ? 'none' : 'block'
  })
  danmuSwitch.innerText = this.hideDanmu ? '开启弹幕' : '关闭弹幕'

  const tip = document.createElement('div')
  tip.className = 'danmu-tip'
  bar.appendChild(tip)
  this.tipEl = tip
}

DanmuPlayer.prototype.setTip = function setTip (tip) {
  this.tipEl.innerText = tip
}

DanmuPlayer.prototype.tryPlay = function tryPlay () {
  try {
    this.video.play()
  } catch (e) {}
}

DanmuPlayer.prototype.onFullScreenChange = function onFullScreenChange () {

}

DanmuPlayer.prototype.onFullpage = function onFullpage (fullScreen) {
  if (this.wrap.getAttribute('fullpage') === null) {
    if (fullScreen) {
      requestFullScreen()
    }
    this.wrap.setAttribute('fullpage', '')
    document.body.appendChild(this.wrap)
    document.body.style.overflow = 'hidden'
  } else {
    exitFullscreen()
    this.wrap.removeAttribute('fullpage')
    this.el.appendChild(this.wrap)
    document.body.style.overflow = 'auto'
  }
  this.tryPlay()
}

DanmuPlayer.prototype.addListener = function addListener () {
  window.addEventListener('message', event => {
    if (event.source != window)
      return

    if (event.data.type && (event.data.type == "DANMU")) {
      const data = event.data.data
      this.onDanmu(data)
    }
  }, false)
}

DanmuPlayer.prototype.onDanmu = function onDanmu (pkg) {
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
  const getColor = c => ["#ff0000", "#1e87f0", "#7ac84b", "#ff7f00", "#9b39f4", "#ff69b4"][c-1]
  if (pkg.txt.length > 0) {
    let cls = []
    let color = getColor(pkg.col) || '#ffffff'
    if (this.isSelf(pkg)) cls.push('danmu-self')
    this.fireDanmu(pkg.txt, color, cls)
  }
}

DanmuPlayer.prototype.calcRect = function calcRect () {
  return this.dmLayout.getBoundingClientRect()
}

DanmuPlayer.prototype.doDefer = function doDefer () {
  const top = this.deferQueue[0]
  const now = new Date().getTime()
  if (this.playing && ((top.oriTime + this.deferTime) <= now)) {
    // console.log(top.oriTime, this.deferTime, now)
    top.run()
    this.deferQueue.shift()
  }
  if (this.deferQueue.length !== 0) {
    // const next = this.deferQueue[0]
    setTimeout(() => this.doDefer(), 100)
  }
}

DanmuPlayer.prototype.fireDanmu = function fireDanmu (text, color = '#ffffff', cls = '') {
  const fire = () => {
    let rect = this.calcRect()
    const duration = rect.width * 7
    let dm = this.pool.shift()
    setTimeout(() => {
      dm.removeAttribute('style')
      this.pool.push(dm)
    }, duration)
    dm.innerText = text
    dm.innerHTML = this.parsePic(dm.innerHTML)
    if (Array.isArray(cls)) cls = cls.join(' ')
    dm.className = cls || ''
    dm.style.left = `${rect.width}px`
    dm.style.display = 'inline-block'
    dm.style.color = color
    setTimeout(() => {
      let dmRect = dm.getBoundingClientRect()
      // console.log(dmRect)
      const row = this.calcRow(dmRect.width, duration)
      // console.log('row', text, row)
      dm.style.top = `${this.baseTop + row * dmRect.height}px`
      dm.style.transition = `transform ${duration/1000}s linear`
      dm.style.transform = `translateX(-${rect.width+dmRect.width}px)`
    }, 0)
  }
  const now = new Date().getTime()
  if (!this.playing || this.deferTime > 0) {
    if (this.deferQueue.length === 0) setTimeout(() => this.doDefer(), 100)
    this.deferQueue.push({
      oriTime: now,
      run: () => fire()
    })
    return
  }
  if (this.hideDanmu) return
  if (this.pool.length == 0) return
  fire()
}

DanmuPlayer.prototype.calcRow = function calcRow (width, duration) {
  let rect = this.calcRect()
  const now = new Date().getTime()
  const check = row => {
    row = this.rows[row]
    if (!row) return true
    if (row.endTime <= now) {
      this.rows[row] = null
      return true
    } else {
      const distance = rect.width + row.width
      const percent = (now - row.beginTime) / row.duration
      const left = rect.width - distance * percent
      if (left + row.width >= rect.width) {
        return false
      }
      const remainTime = row.endTime - now
      const myDistance = rect.width + width
      const leftX = rect.width - (myDistance) * (remainTime / duration)
      if (leftX < 0) {
        return false
      }
    }
    return true
  }
  const add = row => {
    this.rows[row] = {
      duration: duration,
      beginTime: now,
      endTime: now + duration,
      width: width
    }
  }
  let i = 0
  while(true) {
    if (check(i)) {
      add(i)
      return i % this.maxRow
    }
    i++
  }
}