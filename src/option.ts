import Option from './common/view/option.vue'
import Vue from 'vue'
import store from './store'

const option = new Vue({
  ...Option as any,
  store
})
option.$mount('#app')
