<template lang="pug">
  .options
    .loading(v-if='loading') Loading...
    .module(v-if='!loading', v-for='m in modules', :key='cname.get(m)', )
      span(v-text='cname.get(m)')
      component(:is='m')
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  props: {
    options: Object
  },
  data () {
    return {
      loading: true,
      modules: [],
      cname: new WeakMap()
    }
  },
  async created () {
    const options = this.options
    for (let name of Object.keys(options)) {
      const m = options[name]
      const comp = (await m).default
      this.cname.set(comp, name)
      this.modules.push(comp)
    }
    this.loading = false
  }
})
</script>
<style lang="less" scoped>
.options {
  display: block;
}
</style>
