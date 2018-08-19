import Danmu from './Danmu.vue'
import FlvVideo from '../FlvVideo/index.vue'
import Vue from 'vue'

export default Vue.extend({
  props: {
    src: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'flv'
    }
  },
  components: {
    Danmu,
    FlvVideo
  },
  computed: {
  }
})
