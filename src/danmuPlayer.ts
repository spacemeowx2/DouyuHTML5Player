import 'flv.js'
import {requestFullScreen, exitFullscreen, LocalStorage, Timer} from './utils'
import {TypeState} from 'TypeState'
import {GoogleTranslates} from "./GoogleTranslate";
import {TulingRobot} from "./TulingRobot";
import {JSocket} from "./JSocket";
const storage = new LocalStorage('h5plr')
const googleTranslateEngine=new GoogleTranslates();
const tulingRobotEngine=new TulingRobot();
declare global{
    let g_maxRow: number;
    let g_bIsShowingInfo:boolean;
    let g_deltaOffset:any;
}

let bIsSizeChanged:boolean=true;

function findInParent (node: HTMLElement, toFind: HTMLElement) {
  while ((node !== toFind) && (node !== null)) {
    node = node.parentElement
  }
  return node !== null
}

export interface DanmuPlayerListener {
  getSrc (): Promise<string>
  onSendDanmu (txt: string,col:string): void
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
  onSendDanmu (content: string,colorLevel:string): void
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
    csLayout: HTMLCanvasElement;
    wrap: HTMLElement;
    video: HTMLVideoElement;
    el: HTMLElement;
    playerCtrl: HTMLElement;
    tipEl: HTMLElement;
    playPause: HTMLElement;
    msgInput:HTMLInputElement;
    myInfoPanel:HTMLDivElement;
    msgBox:HTMLDivElement;
    bIsInputting:boolean = false;
    hideDanmu = false;
    _muted = false;
    private _roomId = "";
    private _fullscreen = false;
    private _lastY: number = -1;
    private muteEl: HTMLElement;
    private sizeState: SizeStateFSM;
    private __contentHistory=new Array(100);        //用于存储对话纪录
    private __contentHistoryIndex:number=0;         //用于索引对话纪录
    private __contentHistoryLength:number=0;        //用于定义当前实际的纪录数
    private __contentHistoryIsFull:boolean=false;   //对话纪录是否已满

    constructor(private listener: PlayerUIEventListener,
                private state: TypeState.FiniteStateMachine<PlayerState>) {
        const playerContainer = document.createElement('div');
        const playerWrap = document.createElement('div');
        const playerCtrl = document.createElement('div');
        const canvasLayout = document.createElement('canvas');
        const videoBox = document.createElement('div');
        const videoEl = document.createElement('video');
        this.myInfoPanel=document.createElement("div");
        this.msgBox = document.createElement('div');
        this.msgInput = document.createElement('input');
        this.msgInput.id = "dyplr_msgInput";
        this.myInfoPanel.id="dyplr_myInforPanel";

        this.sizeState = new SizeStateFSM();

        let lastState: SizeState;
        this.sizeState
            .on(SizeState.Normal, from => {
                switch (from) {
                    case SizeState.FullPage:
                        bIsSizeChanged = true;
                        this._exitFullPage();
                        break
                    case SizeState.ExitFullScreen:
                        bIsSizeChanged = true;
                        this._exitFullScreen();
                        break
                }
            })
            .on(SizeState.FullPage, from => {
                switch (from) {
                    case SizeState.Normal:
                        bIsSizeChanged = true;
                        this._enterFullPage();
                        break
                    case SizeState.ExitFullScreen:
                        bIsSizeChanged = true;
                        this._enterFullPage();
                        break
                }
            })
            .on(SizeState.FullScreen, from => {
                if (from == SizeState.FullScreen) return
                lastState = from
                switch (from) {
                    case SizeState.Normal:
                        bIsSizeChanged = true;
                        this._enterFullScreen();
                        break
                    case SizeState.FullPage:
                        bIsSizeChanged = true;
                        this._enterFullScreen();
                        break
                }
            })
            .on(SizeState.ExitFullScreen, from => {
                bIsSizeChanged = true;
                this._exitFullScreen();
                this.sizeState.go(lastState);
            })

        videoEl.style.width = videoEl.style.height = '100%';

        this.msgInput.type = 'text';
        this.msgInput.placeholder = '发送弹幕...';

        this.msgBox.className = 'danmu-input';
        videoBox.className = 'danmu-video';
        playerCtrl.className = 'danmu-ctrl';
        canvasLayout.className = 'canvas-layout';
        playerWrap.className = 'danmu-wrap';
        playerContainer.className = 'danmu-container';
        this.myInfoPanel.className='danmu-myInfoPanel';

        videoBox.appendChild(videoEl);
        this.msgBox.appendChild(this.msgInput);
        playerWrap.appendChild(this.myInfoPanel);
        playerWrap.appendChild(videoBox);
        playerWrap.appendChild(playerCtrl);
        playerWrap.appendChild(canvasLayout);
        playerWrap.appendChild(this.msgBox);
        playerContainer.appendChild(playerWrap);

        let timer = new Timer(1000)
        timer.onTimer = () => playerWrap.removeAttribute('hover');
        this.myInfoPanel.addEventListener("mouseover",()=>{
            g_bIsShowingInfo=false;
        });
        this.myInfoPanel.addEventListener("mouseout", () => {
            g_bIsShowingInfo=true;
            setTimeout(()=>{
                if (g_bIsShowingInfo){
                    g_bIsShowingInfo=false;
                    this.myInfoPanel.style.display = "none";
                }
            },3000);
        });
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
        });
        playerWrap.addEventListener('click', event => {
            // if (event.path.indexOf(msgBox) !== -1) return
            if (findInParent(event.target as any, this.msgBox)) return;
            playerWrap.removeAttribute('inputing');
            this.bIsInputting = false;
        });
        document.addEventListener('keydown', event => {
            let __this=this;
            switch(event.keyCode) {
                case 13:// enter
                    if (this.sizeState.is(SizeState.Normal)) return;
                    if ((event.target as any).nodeName.toUpperCase() === 'TEXTAREA') return;
                    if ((event.target as any).className === 'danmu-inputOfDtsSpeed') return;
                    if(this.bIsInputting) {
                        let msgTxt = __this.msgInput.value.trim();
                        if (msgTxt.length > 1) {
                            let cmdLines = msgTxt.split(/[ 　]+/);
                            if (cmdLines.length > 1) {
                                switch (cmdLines[0].toLowerCase()) {
                                    //Tuling robot query
                                    case "/r":
                                    case "/robot":
                                        tulingRobotEngine.GetTulingRobotAnswer(msgTxt.substr(msgTxt.indexOf(cmdLines[1])), __this.ShowResultMessage);
                                        return;
                                    //Language query
                                    case "/t":
                                    case "/translate":
                                        if (cmdLines.length > 2) googleTranslateEngine.GetGoogleTranslate(msgTxt.substr(msgTxt.indexOf(cmdLines[2])), "auto", cmdLines[1], __this.ShowResultMessage);
                                        else __this.ShowResultMessage(null, `<a>格式不对，无法执行翻译！</a>`, 10);
                                        return;
                                    case "/h":
                                    case "/help":
                                        switch (cmdLines[1]){
                                            case "t":
                                            case "翻译":
                                                __this.ShowResultMessage(null,googleTranslateEngine.GetLanguageCodesHtml(),45);
                                                break;
                                            default:
                                                __this.ShowResultMessage(null, `<a>无相关帮助信息，可输入/h查看详细帮助。</a>`, 10);
                                                break;
                                        }
                                        return;
                                    case "/s":
                                    case "/setting":
                                        if (cmdLines.length>2) {
                                            switch (cmdLines[1]) {
                                                case "city":
                                                case "城市":
                                                    __this.ShowResultMessage(null, tulingRobotEngine.SetCityInfo(cmdLines[2]) ? `<p><a>设置成功！</a></p>` : `<p><a>城市名称不规范，设置失败！</a></p>`, 10);
                                                    return;
                                                case "apikey":
                                                case "图灵密钥":
                                                    __this.ShowResultMessage(null, tulingRobotEngine.SetTulingApiKey(cmdLines[2]) ? `<p><a>设置成功！</a></p>` : `<p><a>密钥格式不规范，设置失败！</a></p>`, 10);
                                                    return;
                                                case "jsocketurl":
                                                    __this.ShowResultMessage(null, JSocket.setJsocketUrl(cmdLines[2]) ? `<p><a>设置成功！</a></p>` : `<p><a>swf所在url格式不规范，设置失败！</a></p>`, 10);
                                                    return;
                                            }
                                        }
                                        __this.ShowResultMessage(null, `<a>设置选项有误，可输入/h查看详细帮助。</a>`, 10);
                                        return;
                                }
                            }
                            else{
                                if (cmdLines[0]=="/h"||cmdLines[0]=="/help") {
                                    __this.ShowResultMessage(null, `<p><i>与图灵机器人对话：</i><a>/r 【你的内容】</a></p><p><i>使用谷歌翻译：</i><a>/t 【目标语言或英文代码】 【要翻译的字句】</a></p><p><i>执行设置：</i><a>/s 【选项】 【参数】</a></p><p><i>打开帮助：</i><a>/h</a></p><p><i>显示语言代码表：</i><a>/h 翻译</a></p><p><i>设置你所在的城市（用于图灵机器人自动定位）：</i><a>/s 城市 【某某市】</a></p><p><i>设置新的图灵APIKey：</i><a>/s 图灵密钥 【APIKey】</a></p><p><i>使用默认的图灵APIKey：</i><a>/s 图灵密钥 默认</a></p>`, 30);
                                    return;
                                }
                            }
                            let bIsInIt: boolean = false;
                            //纪录对话纪录
                            for (let i = 0; i < __this.__contentHistoryLength; i++) {
                                if (__this.__contentHistory[i] === msgTxt) {
                                    bIsInIt = true;
                                    break;
                                }
                            }
                            if (!bIsInIt) {
                                __this.__contentHistory[__this.__contentHistoryLength] = msgTxt;
                                __this.__contentHistoryLength = __this.__contentHistoryLength + 1;
                                //对话纪录满，覆盖第一个纪录，开始循环，并设置已满
                                if (__this.__contentHistoryLength >= 100) {
                                    __this.__contentHistoryIsFull = true;
                                    __this.__contentHistoryLength = 0;
                                }
                            }
                            listener.onSendDanmu(msgTxt, this.getSelectedColor());
                        }
                        playerWrap.removeAttribute('inputing');
                        this.bIsInputting = false;
                        break;
                    }
                    else {
                        __this.msgInput.value = '';
                        playerWrap.setAttribute('inputing', '');
                        __this.msgInput.focus();
                        this.bIsInputting = true;
                    }
                    break;
                case 27: // esc
                    if ((event.target as any).nodeName.toUpperCase() === 'TEXTAREA') return;
                    if ((event.target as any).className === 'danmu-inputOfDtsSpeed') return;
                    if ((event.target as any).nodeName.toUpperCase() === 'INPUT') {
                        if (__this.msgInput.value==='')playerWrap.removeAttribute('inputing');
                        else __this.msgInput.value = '';
                        break;
                    }
                    if (this.sizeState.is(SizeState.FullPage)) {
                        this.sizeState.go(SizeState.Normal)
                    }
                    if (this.sizeState.is(SizeState.FullScreen)) {
                        this.sizeState.go(SizeState.ExitFullScreen)
                    }
                    break;
                case 38: // up arrow
                    if (event.ctrlKey) {
                        //没有纪录，则直接返回
                        if ((__this.__contentHistoryLength === 0) && (!__this.__contentHistoryIsFull))
                            break;
                        //索引为零时
                        if (__this.__contentHistoryIndex <= 0) {
                            if (__this.__contentHistoryIsFull) {
                                __this.__contentHistoryIndex = 99;
                            } else {
                                __this.__contentHistoryIndex = 0;
                            }
                        } else
                            __this.__contentHistoryIndex = __this.__contentHistoryIndex - 1;
                        __this.msgInput.value = __this.__contentHistory[__this.__contentHistoryIndex];
                    }
                    break;
                case 40: // down arrow
                    if (event.ctrlKey) {
                        //没有纪录，则直接返回
                        if ((__this.__contentHistoryLength === 0) && (!__this.__contentHistoryIsFull))
                            break;

                        if (__this.__contentHistoryIndex < (__this.__contentHistoryLength - 1))
                            __this.__contentHistoryIndex = __this.__contentHistoryIndex + 1;
                        else {
                            //索引值为满时
                            if (__this.__contentHistoryIsFull) {
                                //索引达到最后一个时
                                if (__this.__contentHistoryIndex >= 99) {
                                    __this.__contentHistoryIndex = 0;
                                } else
                                    __this.__contentHistoryIndex = __this.__contentHistoryIndex + 1;
                            }
                        }
                        __this.msgInput.value=__this.__contentHistory[__this.__contentHistoryIndex];
                    }
                    break;
            }
        });
        document.addEventListener('webkitfullscreenchange', event => {
            this._fullscreen = !this._fullscreen
            if (!this._fullscreen) {
                if (this.sizeState.is(SizeState.FullScreen)) {
                    this.sizeState.go(SizeState.ExitFullScreen)
                }
            }
        })
        window.addEventListener('unload', event => {
            listener.onStop();
            listener.onUnload();
        })

        this.video = videoEl;
        this.el = playerContainer;
        this.wrap = playerWrap;
        this.csLayout = canvasLayout;
        this.playerCtrl = playerCtrl;
        this.transparent = this.transparent;
    }

    public ShowResultMessage(objInputText:string,objDivHtml:string,showingTime:number){
        let __msgInput=document.getElementById("dyplr_msgInput");
        let __myInfoPanel= document.getElementById("dyplr_myInforPanel");
        __msgInput.value = objInputText == null || objInputText == "" || objInputText == 'undefined' ? "":objInputText;
        __myInfoPanel.innerHTML = objDivHtml == null || objDivHtml == "" || objDivHtml == 'undefined' ? "" : objDivHtml;
        if (showingTime>0){
             __myInfoPanel.style.display="block";
            if (!g_bIsShowingInfo){
                g_bIsShowingInfo=true;
                setTimeout(() => {
                    if (g_bIsShowingInfo){
                         __myInfoPanel.style.display = "none";
                        g_bIsShowingInfo=false;
                    }
                }, showingTime * 1000);
            }
        }
        else{
            if (g_bIsShowingInfo){
                 __myInfoPanel.style.display = "none";
                g_bIsShowingInfo=false;
            }
        }
    }

    protected  getSelectedColor(){
        let colorLevel:number = 0;
        try {
            let objLis = document.getElementById("js-fans-barrage").getElementsByTagName("ul")[0].getElementsByTagName("li");
            if (objLis) {
                for (let i = 0; i < objLis.length; i++) {
                    if (objLis[i].className === "selected") {
                        let objDiv: HTMLDivElement = objLis[i].getElementsByTagName("div")[0];
                        if (objDiv) {
                            colorLevel = parseInt(objDiv.getAttribute("data-color-id"));
                            break;
                        }
                    }
                }
            }
        }
        catch (e) {
            console.log(e);
        }
        return colorLevel>1 ? colorLevel.toString():"0";
    }

    protected _exitFullScreen() {
        exitFullscreen()
        this.wrap.removeAttribute('fullpage')
        this.el.appendChild(this.wrap)
        document.body.style.overflow = document.body.parentElement.style.overflow = 'auto'
        this.listener.onTryPlay()
    }

    protected _enterFullScreen() {
        requestFullScreen()
        this.wrap.setAttribute('fullpage', '')
        document.body.appendChild(this.wrap)
        document.body.style.overflow = document.body.parentElement.style.overflow = 'hidden'
        this.listener.onTryPlay()
    }

    protected _exitFullPage() {
        this.wrap.removeAttribute('fullpage')
        this.el.appendChild(this.wrap)
        document.body.style.overflow = document.body.parentElement.style.overflow = 'auto'
        this.listener.onTryPlay()
    }

    protected _enterFullPage() {
        this.wrap.setAttribute('fullpage', '')
        document.body.appendChild(this.wrap)
        document.body.style.overflow = document.body.parentElement.style.overflow = 'hidden'
        this.listener.onTryPlay()
    }

    get transparent() {
        return parseInt(storage.getItem('transparent', '0'))
    }

    set transparent(val: number) {
        storage.setItem('transparent', val.toString())
        this.csLayout.style.opacity = (1 - val / 100).toString()
    }

    get playing() {
        return this.state.is(PlayerState.Playing) || this.state.is(PlayerState.Buffering)
    }

    set playing(val: boolean) {
        if (val) {
            this.state.go(PlayerState.Playing)
        } else {
            this.state.go(PlayerState.Paused)
        }
    }

    get muted() {
        return this._muted
    }

    set muted(v) {
        this.listener.onMute(v)
        if (v) {
            this.muteEl.setAttribute('muted', '')
        } else {
            this.muteEl.removeAttribute('muted')
        }
        this._muted = v
    }

    notifyStateChange() {
        if (this.playing) {
            this.playPause.setAttribute('pause', '')
        } else {
            this.playPause.removeAttribute('pause')
        }
    }

    setCookie() {
        if (this._roomId === "") this._roomId = document.getElementById('dy_roomId').value;
        const Days = 365;
        let exp = new Date();
        exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
        document.cookie = `dtsDeltaOffset_${this._roomId}=${g_deltaOffset};expires=${exp.toUTCString()}`;

    }

    getCookie() {
        if (this._roomId === "") this._roomId = document.getElementById('dy_roomId').value;
        let t = new RegExp("(^| )dtsDeltaOffset_" + this._roomId + "=([^;]*)(;|$)");
        let n = document.cookie.match(t);
        return n ? n[2] : "0";
    }

    initControls() {
        if (this.tipEl) return
        let bar = this.playerCtrl
        const now = () => new Date().getTime()
        const addBtn = (cls: string, cb: () => void) => {
            const btn = document.createElement('a')
            btn.className = ['danmu-btn', 'danmu-' + cls].join(' ')
            if (cb) btn.addEventListener('click', cb)
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


        const labelDtsSpeed = addBtn('labelDts', null);
        labelDtsSpeed.innerText = "音频偏移量：";
        const inputOfDtsSpeed = document.createElement("input");
        inputOfDtsSpeed.addEventListener('keydown', (e) => {
            if (e.keyCode === 13) {
                let n = parseInt(inputOfDtsSpeed.value.trim());
                if (isNaN(n)) {
                    alert("请输入纯数字！");
                }
                else {
                    if (Math.abs(n) > 100000) {
                        alert("输入的数字超过限定大小！");
                    }
                    else {
                        g_deltaOffset = n;
                        this.setCookie();
                        valueOfDtsSpeed.innerText = g_deltaOffset;
                        valueOfDtsSpeed.style.display = "block";
                        inputOfDtsSpeed.style.display = "none";
                    }
                }
            }
            else if (e.keyCode === 27) {
                valueOfDtsSpeed.style.display = "block";
                inputOfDtsSpeed.style.display = "none";
            }
        });
        bar.appendChild(inputOfDtsSpeed);
        inputOfDtsSpeed.className = "danmu-inputOfDtsSpeed";
        const valueOfDtsSpeed = addBtn('valueOfDts', () => {
            valueOfDtsSpeed.style.display = "none";
            inputOfDtsSpeed.style.display = "block";
            inputOfDtsSpeed.value = g_deltaOffset;
            inputOfDtsSpeed.select();
            inputOfDtsSpeed.focus();
        });
        g_deltaOffset = parseInt(valueOfDtsSpeed.innerText = this.getCookie());
        inputOfDtsSpeed.value = g_deltaOffset;
        addBtn('addDts', () => {
            g_deltaOffset += 1;
            valueOfDtsSpeed.innerText = g_deltaOffset;
            valueOfDtsSpeed.style.display = "block";
            inputOfDtsSpeed.style.display = "none";
            this.setCookie();
        })
        addBtn('minusDts', () => {
            g_deltaOffset -= 1;
            valueOfDtsSpeed.innerText = g_deltaOffset;
            valueOfDtsSpeed.style.display = "block";
            inputOfDtsSpeed.style.display = "none";
            this.setCookie();
        })
        addBtn('resetDts', () => {
            g_deltaOffset = 0;
            valueOfDtsSpeed.innerText = g_deltaOffset;
            valueOfDtsSpeed.style.display = "block";
            inputOfDtsSpeed.style.display = "none";
            this.setCookie();
        })

        const danmuSwitch = addBtn('switch', () => {
            this.hideDanmu = !this.hideDanmu;
            this.listener.onHideDanmu(this.hideDanmu);
            danmuSwitch.innerText = this.hideDanmu ? '开启弹幕' : '关闭弹幕';
            storage.setItem("isHideDanmu", this.hideDanmu ? "1" : "0");
            this.csLayout.style.display = this.hideDanmu ? 'none' : 'block';
        })
        this.hideDanmu = storage.getItem("isHideDanmu", "1") === "1";
        danmuSwitch.innerText = this.hideDanmu ? '开启弹幕' : '关闭弹幕';

        const tip = document.createElement('div')
        tip.className = 'danmu-tip'
        bar.appendChild(tip)
        this.tipEl = tip
    }

    createVolume(cb: (v: number) => void) {
        const volume = document.createElement('div');
        const progress = document.createElement('div');
        const input = document.createElement('input');
        volume.className = 'danmu-volume';
        progress.className = 'progress';
        input.type = 'range';
        volume.appendChild(input);
        volume.appendChild(progress);

        input.value = storage.getItem('volume') || '100'
        cb(parseInt(input.value) / 100)
        input.addEventListener('input', event => {
            progress.style.width = `${input.value}%`
            cb(parseInt(input.value) / 100)
            storage.setItem('volume', input.value)
        })
        progress.style.width = `${input.value}%`
        return volume
    }

    setTip(tip: string) {
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
    }, 1000);
    this.reset();
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
      const bufDelayTime = buffered.end(buffered.length - 1) - this.player.currentTime;  //已缓存的时长距离当前播放的时长的延迟长度
      const state = this.dmPlayer.state
      // console.log(buffered.end(buffered.length - 1), this.player.currentTime, buf)
      if (state.is(PlayerState.Playing)) {
        if (bufDelayTime <= 1) {
          state.go(PlayerState.Buffering);
          this.dmPlayer.ui.notifyStateChange();
          this.bufTime *= 2;
          if (this.bufTime > 8) {
            console.warn('网络不佳')
            this.bufTime = 8
          }
        }
      } else if (state.is(PlayerState.Buffering)) {
        if (bufDelayTime > this.bufTime) {
          state.go(PlayerState.Playing)
          this.dmPlayer.player.currentTime += bufDelayTime>5 ? bufDelayTime-3:0;
          this.dmPlayer.ui.notifyStateChange()
        }
      }
    }
  }
}

export class DanmuPlayer implements PlayerUIEventListener {
    inputing: boolean = false;
    listener: DanmuPlayerListener;
    player: FlvJs.Player;
    ui: PlayerUI;
    state: PlayerStateFSM;
    mgr: DanmuManager;
    private _src: string = '';
    private _moveId: number;
    private lastVolume: number;
    private _pauseInterval: number = 0;
    private bufferMonitor: PlayerBufferMonitor;

    onVolumeChange(vol: number) {
        this.player.volume = vol
    }

    onReload() {
        this.stop()
        this.load()
    }

    onSendDanmu(txt: string,col:string) {
        this.listener.onSendDanmu(txt,col)
    }

    onStop() {
        this.stop()
    }

    onUnload() {
        this.bufferMonitor.unload()
    }

    onTryPlay() {
        this.tryPlay()
    }

    onMute(muted: boolean) {
        if (muted) {
            this.lastVolume = this.player.volume
            this.player.volume = 0
        } else {
            this.player.volume = this.lastVolume

        }
    }

    onHideDanmu(hide: boolean) {
        this.mgr.hideDanmu = hide
    }

    onStat(e: { speed: number }) {
        this.ui.setTip(Math.round(e.speed * 10) / 10 + 'KB/s')
    }

    async load() {
        this.src = await this.listener.getSrc()
    }

    createFlvjs() {
        const sourceConfig = {
            isLive: true,
            type: 'flv',
            url: this.src
        }
        const playerConfig = {
            enableWorker: false,
            deferLoadAfterSourceOpen: true,
            stashInitialSize: 512 * 1024,
            enableStashBuffer: true,
            autoCleanupSourceBuffer: true,
            accurateSeek: true,
            reuseRedirectedURL: true
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

    stop() {
        this.state.go(PlayerState.Stopped)
    }

    set src(val) {
        if (val) {
            this._src = val
            this.stop()
            let player = this.createFlvjs()
            this.player = player
            this.ui.initControls()
            this.state.go(PlayerState.Playing)
        }
    }

    get src() {
        return this._src
    }

    constructor(listener: DanmuPlayerListener, ui?: PlayerUI) {
        this.bufferMonitor = new PlayerBufferMonitor(this)
        this.state = new PlayerStateFSM()

        const now = () => new Date().getTime()
        let beginTime = 0
        this.state
            .on(PlayerState.Stopped, () => {
                beginTime = 0
                //this.mgr.deferTime = 0
                this.bufferMonitor.reset()
                if (this.player) {
                    this.player.unload()
                    this.player.detachMediaElement()
                    this.player = null
                }
            })
            .on(PlayerState.Paused, from => {
                beginTime = now();
                this._pauseInterval = setInterval(() => {
                    let __this = this;
                    if (now() - beginTime > 30 * 1000) {
                        __this.player.unload();
                        __this.player.detachMediaElement();
                        __this.player = null;
                        clearInterval(__this._pauseInterval);
                        __this._pauseInterval = 0;
                    }
                }, 1000);
                this.player.pause()
            })
            .on(PlayerState.Playing, from => {
                if (this._pauseInterval != 0) {
                    clearInterval(this._pauseInterval);
                    this._pauseInterval = 0;
                }
                if (beginTime != 0) {
                    if (now() - beginTime > 30 * 1000) {
                        this.onReload();
                        return;
                    }
                }
                this.player.play()
            })
            .on(PlayerState.Buffering, from => {
                beginTime = 0
                this.player.pause()
            })

        this.initUI()
        this.mgr = new DanmuManager(this.ui.csLayout, this.state)

        this.listener = listener
    }

    initUI() {
        this.ui = new PlayerUI(this, this.state)
    }

    tryPlay() {
        if (this.state.is(PlayerState.Playing)) {
            try {
                this.ui.video.play()
            } catch (e) {
            }
        }
    }

    fireDanmu(text: string, color: string, bkColor: string, colorLevel: number, isSelf: boolean) {
        return this.mgr.fireDanmu(text, color, bkColor, colorLevel, isSelf)
    }
}

class DanmuManager {
  //canvas settings
  //canvas's 2d context
  hideDanmu:boolean = false;
  ctx:object = null;
  ctxTemplate:object=null;
  ctxShadowTemplate:object=null;
  canvasTemplate:HTMLCanvasElement=null;
  canvasShadowTemplate:HTMLCanvasElement=null;
  //messages to show stored in the pool
  totalPoolLength:number=1075;  //=(1920/((1+2)*25))*(1080/25)
  usedPoolLength:number=0;
  msgsPool=new Array(this.totalPoolLength);
  //canvas rect
  csRect:object = null;
  //canvas font
  csFont="25px 楷体";
  //canvas showing interval
  bIsRendering:boolean = false;
  //Last duplicate showing row
  csLastDupRow:number=1;
  csLastRowHeight:number=0;
  csLastOldRowheight:number=0;
  csRowsFinishiedTime=new Array(43);
  csTotalRows:number=0;
  csOldStyle:number=0;

  constructor (private canvasLayout: HTMLCanvasElement, private state: TypeState.FiniteStateMachine<PlayerState>) {
    this.hideDanmu=storage.getItem("isHideDanmu","1")==="1";
    this.ctx=canvasLayout.getContext("2d");
    this.canvasTemplate=document.createElement("canvas");
    this.ctxTemplate=this.canvasTemplate.getContext("2d");
    this.canvasShadowTemplate=document.createElement("canvas");
    this.ctxShadowTemplate=this.canvasShadowTemplate.getContext("2d");
  }
  putMsg(dataT:string,leftL:number,topT:number,duration:number,dispearT:number,colorC:string,bkColorC:string,colorLevel:number,isSelf:boolean){
    for(let i=0;i<this.msgsPool.length;i++){
      if (this.msgsPool[i] == null || this.msgsPool[i] == "" || typeof(this.msgsPool[i]) == "undefined") {
        this.msgsPool[i] = {
            msg:dataT,
            L:leftL,
            T:topT,
            S:duration,
            C:colorC,
            B:bkColorC,
            V:colorLevel,
            D:dispearT,
            O:isSelf
        };
        this.usedPoolLength++;
        break;
      }
    }
  }
  fireDanmu (text: string, color: string, bkColor:string, colorLevel:number, isSelf:boolean) {
    if (this.hideDanmu){
        this.usedPoolLength=0;
        for(let i=0;i<this.msgsPool.length;i++)this.msgsPool[i]=null;
        this.bIsRendering=false;
        bIsSizeChanged=true;
        return;
    }
    //remove face charactors
    if((text=text.trim().replace(/\[emot:dy(.*?)\]/g,""))=="")return;
    if(bIsSizeChanged){
      this.csRect=this.canvasLayout.getBoundingClientRect();
      this.ctxShadowTemplate.width=this.ctxTemplate.width=this.ctx.width=this.canvasShadowTemplate.width=this.canvasTemplate.width=this.canvasLayout.width=this.csRect.width;
      this.ctxShadowTemplate.height=this.ctxTemplate.height=this.ctx.height=this.canvasShadowTemplate.height=this.canvasTemplate.height=this.canvasLayout.height=this.csRect.height;
      this.ctxShadowTemplate.font=this.ctxTemplate.font=this.csFont;  //if the canvas size is changed the font family must be changed after them! must after them !
      this.ctxTemplate.strokeStyle="red";
      this.ctxShadowTemplate.fillStyle ="black";
      this.csTotalRows=Math.round(this.csRect.height/25);
      bIsSizeChanged=false;
    }
    if(g_maxRow<this.csTotalRows)this.csTotalRows=g_maxRow;
    let n=(new Date()).getTime(); //current time
    let s=8-colorLevel+(this.usedPoolLength>(this.totalPoolLength/5*4) ? 5:0);//if the pool is almost full accelerate the speed
    let d=(text.length+2)*25;  //total text width pixels
    let m=Math.round((d/(s/16))); //total time needs to display with text length 16:for screen refresh rate:60 1000ms/60fps=16.6ms/fps
    let z=-1; //current row number
    for(let i=0;i<this.csTotalRows;i++){
      if(this.csRowsFinishiedTime[i]){
        if(n>this.csRowsFinishiedTime[i]){
          this.csRowsFinishiedTime[i]=n+m;
          z=i;
          break;
        }
      }
      else{
        this.csRowsFinishiedTime[i]=n+m;
        z=i;
        break;
      }
    }
    //all full? force to speed row;
    if(z==-1){
      z=(++this.csLastDupRow>this.csTotalRows ? this.csLastDupRow=1:this.csLastDupRow);
      //accelerate the speed
      s+=4;
    }
    else z++;
    this.putMsg(text,this.csRect.width,z*25,s,0-d+2*25,color,bkColor,colorLevel,isSelf);
    const canvasFire=()=>{
      let ___this=this;
      if(___this.usedPoolLength<=0){
        ___this.bIsRendering=false;
        return;
      }
      ___this.csLastOldRowheight=___this.csLastRowHeight;
      ___this.ctxTemplate.clearRect(0,0,___this.csRect.width,___this.csLastRowHeight);
      ___this.ctxShadowTemplate.clearRect(0,0,___this.csRect.width,___this.csLastRowHeight);
      ___this.csLastRowHeight=0;
      ___this.csOldStyle=0;
      for (var i = 0; i < ___this.msgsPool.length; i++) {
        if (___this.msgsPool[i]) {
            if(___this.msgsPool[i].L<___this.msgsPool[i].D){
              ___this.msgsPool[i]=null;
              ___this.usedPoolLength--;
            }else {
              ___this.msgsPool[i].L-=___this.msgsPool[i].S;
              if(___this.csOldStyle!=___this.msgsPool[i].V){
                ___this.ctxTemplate.fillStyle =___this.msgsPool[i].C;
                //___this.ctxShadowTemplate.fillStyle =___this.msgsPool[i].B;
                  ___this.csOldStyle=___this.msgsPool[i].V;
              }
              if(___this.msgsPool[i].T>___this.csLastRowHeight)___this.csLastRowHeight=___this.msgsPool[i].T;
              ___this.ctxTemplate.fillText(___this.msgsPool[i].msg,___this.msgsPool[i].L,___this.msgsPool[i].T);
              ___this.ctxShadowTemplate.fillText(___this.msgsPool[i].msg,___this.msgsPool[i].L,___this.msgsPool[i].T);
              //for self text, draw a rectangle out of the text
              if(___this.msgsPool[i].O)___this.ctxTemplate.strokeRect(___this.msgsPool[i].L,___this.msgsPool[i].T-25,___this.msgsPool[i].msg.length*25,25);
            }
        }
      }
      ___this.ctx.clearRect(0,0,___this.csRect.width,___this.csLastOldRowheight);
      ___this.ctx.drawImage(___this.canvasShadowTemplate,1,1);
      ___this.ctx.drawImage(___this.canvasTemplate,0,0);
      ___this.csLastRowHeight+=26;
      requestAnimationFrame(canvasFire);
    }
    if(!this.bIsRendering){
      this.bIsRendering=true;
      canvasFire();
    }
  }
}
