/*
 * Jsocket - Socket on Javascript
 * Author: Masahiro Chiba <nihen@megabbs.com>
 * Depends:
 *  - jQuery: http://jquery.com/
 *  - jQuery TOOLS - Flashembed: http://flowplayer.org/tools/flashembed.html
 * SYNOPSIS:
 *  JSocket.init('/static/JSocket.swf', function () {
 *     socket = new JSocket({
 *         connectHandler: connectHandler,
 *         dataHandler:    dataHandler,
 *         closeHandler:   closeHandler,
 *         errorHandler:   errorHandler
 *     });
 *     socket.connect(location.hostname, location.port || 80);
 *  });
 *  function connectHandler() {
 *      socket.writeFlush("GET / HTTP/1.0\x0D\x0A");
 *      socket.write("Host: " + location.hostname + "\x0D\x0A\x0D\x0A");
 *      socket.flush();
 *  }
 *  function dataHandler(data) {
 *      alert(data);
 *      socket.close();
 *  }
 *  function closeHandler() {
 *      alert('lost connection')
 *  }
 *  function errorHandler(errorstr) {
 *      alert(errorstr);
 *  }
 *  
 * */

import {LocalStorage} from "./utils";

declare var window: {
  [key: string]: any
} & Window

export class Handlers {
  connectHandler () {}
  dataHandler (data: string) {}
  closeHandler () {}
  errorHandler (err: string) {}
}
export class JSocket {
  socid: number
  private static swfloadedcb: Function
  static defaultJsocketUrl="https://imspace.nos-eastchina1.126.net/JSocket2.swf";
  static VERSION = '0.1'
  static el: HTMLDivElement
  static flashapi: any
  static async init () {
    let oldDiv=document.getElementById("jsocket");
    if(!oldDiv) {
      // const src = 'https://imspace.applinzi.com/player/JSocket.swf'
      const storage = new LocalStorage('h5plr');
      const src =storage.getItem("JSocket_Url", JSocket.defaultJsocketUrl);
      const flash = ['<object type="application/x-shockwave-flash" ', 'id="jsocket" ', 'name="jsocket" ', 'align="middle" ', 'allowscriptaccess="always" ', 'allowfullscreen="true" ', 'allowfullscreeninteractive="true" ', 'wmode="transparent" ', 'data="' + src + '" ', 'width="100%" ', 'height="100%">', '<param name="src" value="' + src + '">', '<param name="quality" value="high">', '<param name="bgcolor" value="#fff">', '<param name="allowscriptaccess" value="always">', '<param name="allowfullscreen" value="true">', '<param name="wmode" value="transparent">', '<param name="allowFullScreenInteractive" value="true">', '<param name="flashvars" value="">', "</object>"].join("")
      let div = document.createElement('div')
      div.className = 'jsocket-cls' // 防止Chrome屏蔽小块的 Flash
      document.body.appendChild(div);
      JSocket.el = div;
      div.innerHTML = flash;
    }
    var api = document.querySelector('#jsocket')
    JSocket.flashapi = api;
    if (JSocket.flashapi.newsocket) {
      return
    } else {
      return new Promise<void>((res, rej) => {
        const id = setTimeout(rej, 10 * 1000)
        JSocket.swfloadedcb = () => {
          clearTimeout(id)
          res()
        }
      })
    }
  }
  static setJsocketUrl(url:string){
    if (url!=null||url!='undefined'){
      const storage= new LocalStorage('h5plr');
      if (url ==="default"||url ==="默认"){
        storage.setItem("JSocket_Url", JSocket.defaultJsocketUrl);
        return true;
      }
      url=url.trim();
      if (url!=""){
        if (/^https\:\/\/[0-9A-Za-z_!~*'().&=+$%-]+.swf$/.test(url)){
            storage.setItem("JSocket_Url",url);
            return true;
        }
      }
    }
    return false;
  }
  static swfloaded () {
      JSocket.swfloadedcb()
  }
  static handlers: Handlers[] = []
  static connectHandler (socid: number) {
    JSocket.handlers[socid].connectHandler()
  }
  static dataHandler (socid: number, data: string) {
    try {
      JSocket.handlers[socid].dataHandler(atob(data))
    } catch (e) {
      console.error(e)
    }
  }
  static closeHandler (socid: number) {
    JSocket.handlers[socid].closeHandler()
  }
  static errorHandler (socid: number, str: string) {
    JSocket.handlers[socid].errorHandler(str)
  }
  init (handlers: Handlers, newsocketopt: any) {
    this.socid = JSocket.flashapi.newsocket(newsocketopt)
    JSocket.handlers[this.socid] = handlers
  }
  connect (host: string, port: number) {
    JSocket.flashapi.connect(this.socid, host, port)
  }
  write (data: string) {
    JSocket.flashapi.write(this.socid, btoa(data))
  }
  writeFlush (data: string) {
    JSocket.flashapi.writeFlush(this.socid, btoa(data))
  }
  close () {
    JSocket.flashapi.close(this.socid)
  }
  flush () {
    JSocket.flashapi.flush(this.socid)
  }
}
window.JSocket = JSocket
