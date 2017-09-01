import 'flv.js'
import {requestFullScreen, exitFullscreen, LocalStorage, Timer} from './utils'
import {TypeState} from 'TypeState'
const storage = new LocalStorage('h5plr')

function findInParent (node: HTMLElement, toFind: HTMLElement) {
  while ((node !== toFind) && (node !== null)) {
    node = node.parentElement
  }
  return node !== null
}

export interface DanmuPlayerListener {
  getSrc (): Promise<string>
  onSendDanmu (txt: string): void
}

export enum PlayerState {
  Stopped,
  Playing,
  Paused,
  Buffering
}
export enum SizeState {
  Normal,
  FullPage,
  FullScreen,
  ExitFullScreen
}

export interface PlayerUIEventListener {
  onReload (): void
  onSendDanmu (content: string): void
  onStop (): void
  onTryPlay (): void
  onVolumeChange (percent: number): void
  onMute (muted: boolean): void
  onHideDanmu (hide: boolean): void
  onUnload (): void
}
class SizeStateFSM extends TypeState.FiniteStateMachine<SizeState> {
  constructor () {
    super(SizeState.Normal)
    this.fromAny(SizeState).to(SizeState.Normal)
    this.fromAny(SizeState).to(SizeState.FullPage)
    this.fromAny(SizeState).to(SizeState.FullScreen)
    this.from(SizeState.FullScreen).to(SizeState.ExitFullScreen)
  }
  onTransition (from: SizeState, to: SizeState) {
    console.log('SizeFSM', from, to)
  }
}
class PlayerStateFSM extends TypeState.FiniteStateMachine<PlayerState> {
  constructor () {
    super(PlayerState.Stopped)
    this.fromAny(PlayerState).to(PlayerState.Stopped)
    this.fromAny(PlayerState).to(PlayerState.Playing)
    this.from(PlayerState.Playing).to(PlayerState.Buffering)
    this.from(PlayerState.Playing).to(PlayerState.Paused)
    this.from(PlayerState.Buffering).to(PlayerState.Paused)
  }
  onTransition (from: PlayerState, to: PlayerState) {
    console.log('PlayerFSM', from, to)
  }
}
export class PlayerUI {
  dmLayout: HTMLElement
  wrap: HTMLElement
  video: HTMLVideoElement
  el: HTMLElement
  playerCtrl: HTMLElement
  tipEl: HTMLElement
  playPause: HTMLElement
  inputing = false
  hideDanmu = false
  _muted = false
  private _fullscreen = false
  private _lastY: number = -1
  private muteEl: HTMLElement
  private sizeState: SizeStateFSM

  constructor (
      private listener: PlayerUIEventListener,
      private state: TypeState.FiniteStateMachine<PlayerState>
    ) {
    const playerContainer = document.createElement('div')
    const playerWrap = document.createElement('div')
    const playerCtrl = document.createElement('div')
    const danmuLayout = document.createElement('div')
    const videoBox = document.createElement('div')
    const msgBox = document.createElement('div')
    const msgInput = document.createElement('input')
    const videoEl = document.createElement('video')

    this.sizeState = new SizeStateFSM()

    let lastState: SizeState
    this.sizeState
    .on(SizeState.Normal, from => {
      switch (from) {
        case SizeState.FullPage:
          this._exitFullPage()
          break
        case SizeState.ExitFullScreen:
          this._exitFullScreen()
          break
      }
    })
    .on(SizeState.FullPage, from => {
      switch (from) {
        case SizeState.Normal:
          this._enterFullPage()
          break
        case SizeState.ExitFullScreen:
          this._enterFullPage()
          break
      }
    })
    .on(SizeState.FullScreen, from => {
      if (from == SizeState.FullScreen) return
      lastState = from
      switch (from) {
        case SizeState.Normal:
          this._enterFullScreen()
          break
        case SizeState.FullPage:
          this._enterFullScreen()
          break
      }
    })
    .on(SizeState.ExitFullScreen, from => {
      this._exitFullScreen()
      this.sizeState.go(lastState)
    })

    videoEl.style.width = videoEl.style.height = '100%'

    msgInput.type = 'text'
    msgInput.placeholder = '发送弹幕...'

    msgBox.className = 'danmu-input'
    videoBox.className = 'danmu-video'
    playerCtrl.className = 'danmu-ctrl'
    danmuLayout.className = 'danmu-layout'
    playerWrap.className = 'danmu-wrap'
    playerContainer.className = 'danmu-container'

    videoBox.appendChild(videoEl)
    msgBox.appendChild(msgInput)
    playerWrap.appendChild(videoBox)
    playerWrap.appendChild(playerCtrl)
    playerWrap.appendChild(danmuLayout)
    playerWrap.appendChild(msgBox)
    playerContainer.appendChild(playerWrap)

    let timer = new Timer(1000)
    timer.onTimer = () => playerWrap.removeAttribute('hover')
    playerWrap.addEventListener('mousemove', event => {
      // const hoverCtl = event.path.indexOf(playerCtrl) !== -1
      const hoverCtl = findInParent(event.target as any, playerCtrl)
      if (event.offsetY - this._lastY == 0) return
      this._lastY = event.offsetY
      let height = playerWrap.getBoundingClientRect().height
      if (event.offsetY > 0) {
        playerWrap.setAttribute('hover', '')
        timer.reset()
      } else {
        playerWrap.removeAttribute('hover')
      }
    })
    playerWrap.addEventListener('click', event => {
      // if (event.path.indexOf(msgBox) !== -1) return
      if (findInParent(event.target as any, msgBox)) return
      playerWrap.removeAttribute('inputing')
      this.inputing = false
    })
    document.addEventListener('keydown', event => {
      if (event.keyCode == 13) { // enter
        if (this.sizeState.is(SizeState.Normal)) return
        if ((event.target as any).nodeName.toUpperCase() === 'TEXTAREA') return
        this.inputing = !this.inputing
        if (this.inputing) {
          msgInput.value = ''
          playerWrap.setAttribute('inputing', '')
          msgInput.focus()
        } else {
          if (msgInput.value.length > 0) {
            listener.onSendDanmu(msgInput.value)
          }
          playerWrap.removeAttribute('inputing')
        }
      } else if (event.keyCode == 27) { // esc
        if (this.sizeState.is(SizeState.FullPage)) {
          this.sizeState.go(SizeState.Normal)
        }
        if (this.sizeState.is(SizeState.FullScreen)) {
          this.sizeState.go(SizeState.ExitFullScreen)
        }
      }
    })

    document.addEventListener('webkitfullscreenchange', event => {
      this._fullscreen = !this._fullscreen
      if (!this._fullscreen) {
        if (this.sizeState.is(SizeState.FullScreen)) {
          this.sizeState.go(SizeState.ExitFullScreen)
        }
      }
    })

    window.addEventListener('unload', event => {
      listener.onStop()
      listener.onUnload()
    })

    this.video = videoEl
    this.el = playerContainer
    this.wrap = playerWrap
    this.dmLayout = danmuLayout
    this.playerCtrl = playerCtrl
    this.transparent = this.transparent
  }
  protected _exitFullScreen () {
    exitFullscreen()
    this.wrap.removeAttribute('fullpage')
    this.el.appendChild(this.wrap)
    document.body.style.overflow = document.body.parentElement.style.overflow = 'auto'
    this.listener.onTryPlay()
  }
  protected _enterFullScreen () {
    requestFullScreen()
    this.wrap.setAttribute('fullpage', '')
    document.body.appendChild(this.wrap)
    document.body.style.overflow = document.body.parentElement.style.overflow = 'hidden'
    this.listener.onTryPlay()
  }
  protected _exitFullPage () {
    this.wrap.removeAttribute('fullpage')
    this.el.appendChild(this.wrap)
    document.body.style.overflow = document.body.parentElement.style.overflow = 'auto'
    this.listener.onTryPlay()
  }
  protected _enterFullPage () {
    this.wrap.setAttribute('fullpage', '')
    document.body.appendChild(this.wrap)
    document.body.style.overflow = document.body.parentElement.style.overflow = 'hidden'
    this.listener.onTryPlay()
  }
  get transparent () {
    return parseInt(storage.getItem('transparent', '0'))
  }
  set transparent (val: number) {
    storage.setItem('transparent', val.toString())
    this.dmLayout.style.opacity = (1 - val / 100).toString()
  }
  get playing () {
    return this.state.is(PlayerState.Playing) || this.state.is(PlayerState.Buffering)
  }
  set playing (val: boolean) {
    if (val) {
      this.state.go(PlayerState.Playing)
    } else {
      this.state.go(PlayerState.Paused)
    }
  }
  get muted () {
    return this._muted
  }
  set muted (v) {
    this.listener.onMute(v)
    if (v) {
      this.muteEl.setAttribute('muted', '')
    } else {
      this.muteEl.removeAttribute('muted')
    }
    this._muted = v
  }
  notifyStateChange () {
    if (this.playing) {
      this.playPause.setAttribute('pause', '')
    } else {
      this.playPause.removeAttribute('pause')
    }
  }
  initControls () {
    if (this.tipEl) return
    let bar = this.playerCtrl
    const now = () => new Date().getTime()
    const addBtn = (cls: string, cb: () => void) => {
      const btn = document.createElement('a')
      btn.className = ['danmu-btn', 'danmu-'+cls].join(' ')
      btn.addEventListener('click', cb)
      bar.appendChild(btn)
      return btn
    }
    this.video.addEventListener('dblclick', event => {
      switch (this.sizeState.currentState) {
        case SizeState.Normal:
          this.sizeState.go(SizeState.FullPage)
          break
        case SizeState.FullPage:
          this.sizeState.go(SizeState.Normal)
          break
        case SizeState.FullScreen:
          this.sizeState.go(SizeState.ExitFullScreen)
          break
      }
      event.preventDefault()
      event.stopPropagation()
    })
    this.playPause = addBtn('playpause', () => {
      this.playing = !this.playing
      this.notifyStateChange()
    })
    this.playPause.setAttribute('pause', '')
    
    const reload = addBtn('reload', () => {
      this.listener.onReload()
    })

    const fullscreen = addBtn('fullscreen', () => {
      if (this.sizeState.is(SizeState.FullScreen)) {
        this.sizeState.go(SizeState.ExitFullScreen)
      } else {
        this.sizeState.go(SizeState.FullScreen)
      }
    })

    const fullpage = addBtn('fullpage', () => {
      switch (this.sizeState.currentState) {
        case SizeState.Normal:
          this.sizeState.go(SizeState.FullPage)
          break
        case SizeState.FullPage:
          this.sizeState.go(SizeState.Normal)
          break
        case SizeState.FullScreen:
          this.sizeState.go(SizeState.ExitFullScreen)
          this.sizeState.go(SizeState.FullPage)
          break
     }
    })

    const volume = this.createVolume(percent => {
      // volume
      // this.player.volume = percent
      this.listener.onVolumeChange(percent)
    })
    bar.appendChild(volume)

    this.muteEl = addBtn('mute', () => {
      this.muted = !this.muted
    })

    const danmuSwitch = addBtn('switch', () => {
      this.hideDanmu = !this.hideDanmu
      this.listener.onHideDanmu(this.hideDanmu)
      danmuSwitch.innerText = this.hideDanmu ? '开启弹幕' : '关闭弹幕'
      this.dmLayout.style.display = this.hideDanmu ? 'none' : 'block'
    })
    danmuSwitch.innerText = this.hideDanmu ? '开启弹幕' : '关闭弹幕'

    const tip = document.createElement('div')
    tip.className = 'danmu-tip'
    bar.appendChild(tip)
    this.tipEl = tip
  }
  createVolume (cb: (v: number) => void) {
    const volume = document.createElement('div')
    const progress = document.createElement('div')
    const input = document.createElement('input')
    volume.className = 'danmu-volume'
    progress.className = 'progress'
    input.type = 'range'
    volume.appendChild(input)
    volume.appendChild(progress)

    input.value = storage.getItem('volume') || '100'
    cb( parseInt(input.value) / 100)
    input.addEventListener('input', event => {
      progress.style.width = `${input.value}%`
      cb( parseInt(input.value) / 100)
      storage.setItem('volume', input.value)
    })
    progress.style.width = `${input.value}%`
    return volume
  }
  setTip (tip: string) {
    this.tipEl.innerText = tip
  }
}

class PlayerBufferMonitor {
  private intId: number
  private bufTime: number
  constructor (protected dmPlayer: DanmuPlayer) {
    this.intId = window.setInterval(() => {
      try {
        this.handler()
      } catch (e) {
        console.error(e)
      }
    }, 200)
    this.reset()
  }
  unload () {
    window.clearInterval(this.intId)
  }
  reset () {
    this.bufTime = 1
  }
  get player () {
    return this.dmPlayer.player
  }
  handler () {
    if (this.player) {
      const buffered = this.player.buffered
      if (buffered.length === 0) return
      const buf = buffered.end(buffered.length - 1) - this.player.currentTime
      const state = this.dmPlayer.state
      // console.log(buffered.end(buffered.length - 1), this.player.currentTime, buf)
      if (state.is(PlayerState.Playing)) {
        if (buf <= 1) {
          state.go(PlayerState.Buffering)
          this.dmPlayer.ui.notifyStateChange()
          this.bufTime *= 2
          if (this.bufTime > 8) {
            console.warn('网络不佳')
            this.bufTime = 8
          }
        }
      } else if (state.is(PlayerState.Buffering)) {
        if (buf > this.bufTime) {
          state.go(PlayerState.Playing)
          this.dmPlayer.player.currentTime -= 0.5
          this.dmPlayer.ui.notifyStateChange()
        }
      }
    }
  }
}

export class DanmuPlayer implements PlayerUIEventListener {
  inputing: boolean = false
  listener: DanmuPlayerListener
  player: FlvJs.Player
  ui: PlayerUI
  state: PlayerStateFSM
  mgr: DanmuManager
  private _src: string = ''
  private _moveId: number
  private lastVolume: number
  private bufferMonitor: PlayerBufferMonitor

  onVolumeChange (vol: number) {
    this.player.volume = vol
  }
  onReload () {
    this.stop()
    this.load()
  }
  onSendDanmu (txt: string) {
    this.listener.onSendDanmu(txt)
  }
  onStop () {
    this.stop()
  }
  onUnload () {
    this.bufferMonitor.unload()
  }
  onTryPlay () {
    this.tryPlay()
  }
  onMute (muted: boolean) {
    if (muted) {
      this.lastVolume = this.player.volume
      this.player.volume = 0
    } else {
      this.player.volume = this.lastVolume
      
    }
  }
  onHideDanmu (hide: boolean) {
    this.mgr.hideDanmu = hide
  }
  onStat (e: {speed: number}) {
    this.ui.setTip(Math.round(e.speed*10)/10 + 'KB/s')
  }
  async load () {
    this.src = await this.listener.getSrc()
  }
  createFlvjs () {    
    const sourceConfig = {
      isLive: true,
      type: 'flv',
      url: this.src
    }
    const playerConfig: FlvJs.Config = {
      enableWorker: false,
      deferLoadAfterSourceOpen: true,
      stashInitialSize: 512 * 1024,
      enableStashBuffer: true,
      autoCleanupMinBackwardDuration: 20,
      autoCleanupMaxBackwardDuration: 40,
      autoCleanupSourceBuffer: true
    }
    const player = flvjs.createPlayer(sourceConfig, playerConfig)
    player.on(flvjs.Events.ERROR, (e: any, t: any) => {
      console.error('播放器发生错误：' + e + ' - ' + t)
      player.unload()
    })
    player.on(flvjs.Events.STATISTICS_INFO, this.onStat.bind(this))

    player.attachMediaElement(this.ui.video)
    player.load()
    player.play()
    return player
  }
  stop () {
    this.state.go(PlayerState.Stopped)
  }
  set src (val) {
    this._src = val
    this.stop()
    let player = this.createFlvjs()
    this.player = player
    this.ui.initControls()
    this.state.go(PlayerState.Playing)
  }
  get src () {
    return this._src
  }
  constructor (listener: DanmuPlayerListener, ui?: PlayerUI) {
    this.bufferMonitor = new PlayerBufferMonitor(this)
    this.state = new PlayerStateFSM()

    const now = () => new Date().getTime()
    let beginTime = 0
    this.state
    .on(PlayerState.Stopped, () => {
      beginTime = 0
      this.mgr.deferTime = 0
      this.bufferMonitor.reset()
      if (this.player) {
        this.player.unload()
        this.player.detachMediaElement()
        this.player = null
      }
    })
    .on(PlayerState.Paused, from => {
      beginTime = now()
      this.player.pause()
    })
    .on(PlayerState.Playing, from => {
      if (beginTime !== 0) {
        this.mgr.deferTime += now() - beginTime
      }
      this.player.play()
    })
    .on(PlayerState.Buffering, from => {
      beginTime = 0
      this.player.pause()
    })
    
    this.initUI()
    this.mgr = new DanmuManager(this.ui.dmLayout, this.state)

    this.listener = listener
  }
  initUI () {
    this.ui = new PlayerUI(this, this.state)
  }
  tryPlay () {
    if (this.state.is(PlayerState.Playing)) {
      try {
        this.ui.video.play()
      } catch (e) {}
    }
  }
  fireDanmu (text: string, color: string, cls: (string | string[])) {
    return this.mgr.fireDanmu(text, color, cls)
  }
}

class DanmuManager {
  private pool: {
    el: HTMLDivElement,
    using: boolean
  }[] = []
  private rows: {
    duration: number,
    beginTime: number,
    endTime: number,
    width: number
  }[] = []
  private _deferTime = 0 // 暂停时间
  maxRow = 10
  baseTop = 10
  deferId: number = null
  deferQueue: {
    oriTime: number,
    run: () => void
  }[] = []
  hideDanmu = false
  parsePic = (i: string) => i
  get playing () {
    return this.state.is(PlayerState.Playing)
  }
  set deferTime (v) {
    this._deferTime = v
    this.defering = v !== 0
  }
  get deferTime () {
    return this._deferTime
  }
  constructor (private danmuLayout: HTMLElement, private state: TypeState.FiniteStateMachine<PlayerState>) {
    const poolSize = 100
    for (let i = 0; i < poolSize; i++) {
      let dm = document.createElement('div')
      danmuLayout.appendChild(dm)
      this.pool.push({
        el: dm,
        using: false
      })
    }
  }
  calcRect () {
    return this.danmuLayout.getBoundingClientRect()
  }
  calcRow (width: number, duration: number) {
    let rect = this.calcRect()
    const now = new Date().getTime()
    const check = (idx: number) => {
      let row = this.rows[idx]
      if (!row) return true
      if (row.endTime <= now) {
        this.rows[idx] = null
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
    let i = 0
    while(true) {
      if (check(i)) {
        this.rows[i] = {
          duration: duration,
          beginTime: now,
          endTime: now + duration,
          width: width
        }
        return i % this.maxRow
      }
      i++
    }
  }
  doDefer () {
    if (this.deferQueue.length === 0) return
    const top = this.deferQueue[0]
    const now = new Date().getTime()
    if (this.playing && ((top.oriTime + this.deferTime) <= now)) {
      // console.log(top.oriTime, this.deferTime, now)
      top.run()
      this.deferQueue.shift()
    }
  }
  set defering (v: boolean) {
    if (this.deferId === null) {
      if (v) {
        this.deferId = window.setInterval(() => this.doDefer(), 100)
      }
    } else {
      if (v === false) {
        window.clearInterval(this.deferId)
        this.deferId = null
      }
    }
  }
  fireDanmu (text: string, color: string, cls: (string | string[])) {
    const fire = () => {
      let rect = this.calcRect()
      const duration = rect.width * 7
      let {el: dm} = this.pool.shift()
      setTimeout(() => {
        dm.removeAttribute('style')
        this.pool.push({
          el: dm,
          using: false
        })
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
      // if (this.deferQueue.length === 0) setTimeout(() => this.doDefer(), 100)
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
}
