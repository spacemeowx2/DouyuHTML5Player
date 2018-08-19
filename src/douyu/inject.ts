import DanmuPlayer from '../components/DanmuPlayer/index.vue'
import Vue from 'vue'
import flvjs from 'flv.js'
import { hookFetch } from 'utils/hook'
import { runtimePort } from 'utils/port'
import { getSourceURL } from 'douyu/source'
hookFetch()

async function main () {
  flvjs.LoggingControl.forceGlobalTag = true
  flvjs.LoggingControl.enableAll = true
  
  const player = new Vue(DanmuPlayer)
  player.$mount('#douyu_room_normal_flash_proxy_box > div')
  console.log('mount')

  // @ts-ignore
  player.src = await getSourceURL('57321', 'ws', '0')
  // @ts-ignore
  console.log(player.src)
}
main().catch(e => console.error(e))
// @ts-ignore
window.test = runtimePort
