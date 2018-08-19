<template lang="pug">
  .danmu-player
    .container
      .wrap
        .video
          flv-video(:src='src')
        .control
          .btn.playpause
        .layout
          danmu
        .input
          input(type='text', placeholder='发送弹幕...')
</template>
<script>
import DanmuPlayer from './DanmuPlayer'
export default DanmuPlayer 
</script>
<style lang="less" scoped>
.danmu-player {
  width: 100%;
  .video > * {
    width: 100%;
    height: 100%;
  }
}
.container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid #e5e4e4;
  box-sizing: border-box;
}
.wrap {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #000;
}
</style>
