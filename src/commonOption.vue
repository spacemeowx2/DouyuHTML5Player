<template lang="pug">
  .common-option
    input(v-model='test')
    p 123 {{test}}
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'common',
  data: () => ({
    test: '321'
  })
})
</script>
<style lang="less" scoped>
.douyu-option {
  .test {

  }
}
</style>
