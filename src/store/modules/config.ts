import { StoreOptions } from 'vuex'
import { appOptions } from '../../declaration'
import * as types from '../mutation-types'

type OptionType = typeof appOptions

interface SectionConfig {
  [key: string]: any
}
interface ConfigState<T> {
  global: {
    [key in keyof T]: T[key]
  },
  room: {
    [key: string]: {
      [key in keyof T]: T[key]
    }
  }
}

const options: StoreOptions<ConfigState<OptionType>> = {
  state: {
    global: appOptions,
    room: {}
  },
  getters: {
  },
  actions: {
  },
  mutations: {
    [types.SET_ROOM_CONFIG] (state, {room, config}: {room: string, config: OptionType}) {
      state.room[room] = config
    },
    [types.SET_CONFIG] (state, {config}: {config: OptionType}) {
      state.global = config
    }
  }
}
export default options
