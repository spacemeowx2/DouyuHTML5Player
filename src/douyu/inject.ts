import DanmuPlayer from '../components/DanmuPlayer/index.vue'
import Vue from 'vue'
import flvjs from 'flv.js'
import { hookFetch } from 'utils/hook'
import { runtimePort } from 'utils/port'
import { getSourceURL } from './source'
import { hook, RoomInfo } from './hook'
hookFetch()

const hookAsync = () => new Promise<RoomInfo>(cb => hook(cb))

async function main () {
  flvjs.LoggingControl.forceGlobalTag = true
  flvjs.LoggingControl.enableAll = true
  
  const { roomId, id } = await hookAsync()
  console.log('hook ok', roomId, id)
  
  const player = new Vue(DanmuPlayer)
  player.$mount(`#${id}`)
  console.log('mount')

  // @ts-ignore
  player.src = await getSourceURL(roomId, 'ws', '0')
  // @ts-ignore
  console.log(player.src)
}
main().catch(e => console.error(e))
// @ts-ignore
window.test = runtimePort
