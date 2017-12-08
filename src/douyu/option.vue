<template lang="pug">
  .douyu-option
    input(v-model='test')
    p 123 {{test}}
</template>
<script lang="ts">
export default {
  data: () => ({
    test: '321'
  })
}
</script>
<style lang="less" scoped>
.douyu-option {
  .test {

  }
}
</style>
