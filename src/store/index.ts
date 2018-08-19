import Vue from 'vue'
import Vuex from 'vuex'
import config from './modules/config'
import { isDebug } from 'utils/helper'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    config
  },
  strict: isDebug
})
