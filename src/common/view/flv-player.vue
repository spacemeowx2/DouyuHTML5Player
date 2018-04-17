<template lang="pug">
  .danmu-player
    h1 Test
    h1 {{hello}}
</template>
<script>
export default {
  data () {
    return {
      hello: 'world'
    }
  }
}
</script>
<style lang="less" scoped>
  .danmu-player {
    width: 100%;
  }
</style>
