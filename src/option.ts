import Option from './common/view/options.vue'
import Vue from 'vue'
import store from './store'

const option = new Vue({
  ...Option as any,
  store
})
option.$mount('#app')
