import Vue from 'vue'
import flvjs, * as FlvJs from 'flv.js'

export default Vue.extend({
  props: {
    src: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      player: {} as FlvJs.Player
    }
  },
  methods: {
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

      player.attachMediaElement(this.$el as HTMLMediaElement)
      player.load()
      player.play()

      this.player = player
    }
  },
  watch: {
    src () {
      this.createFlvjs()
    }
  }
})
