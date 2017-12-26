import Vue from 'vue'
import options from './options.vue'
new Vue({
  el: '#app',
  render: h => h(options, {props: {
    options: {
      '通用': import('../commonOption.vue'),
      '斗鱼': import('../douyu/option.vue')
    }
  }})
})
