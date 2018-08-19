<template lang="pug">
  .options
    h1 选项
    .section(v-for='conf, site in $store.state.config.global')
      h2(v-text='T(site)')
      .option(v-for='v, k in conf')
        h3 {{getOptionName(site, k)}} {{v}}
</template>
<script>
import { appOptionTypes } from '../../declaration'
const dict = new Map([
  ['douyu', '斗鱼'],
  ['common', '通用']
])
export default {
  data () {
    return { 
      hello: 'world'
    }
  },
  methods: {
    T (name) {
      return dict.get(name)
    },
    getOptionName (section, key) {
      console.log(appOptionTypes, key)
      return appOptionTypes[section][key].name
    }
  }
}
</script>
<style lang="less" scoped>
  .options {
    width: 100%;
  }
</style>
