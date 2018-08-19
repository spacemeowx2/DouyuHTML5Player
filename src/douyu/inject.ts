import FlvPlayer from 'components/FlvPlayer.vue'
import Vue from 'vue'
import flvjs from 'flv.js'
import { hookFetch } from 'utils/hook'

hookFetch()

flvjs.LoggingControl.forceGlobalTag = true
flvjs.LoggingControl.enableAll = true

const player = new Vue(FlvPlayer)
player.$mount('#test')
