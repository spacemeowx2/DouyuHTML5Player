<template lang="pug">
  .danmu
</template>
<script>
export default {
  
}
</script>

<style lang="less" scoped>
.danmu {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;

  color: #fff;
  font-size: 25px;
  font-family: SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif;
  text-shadow: rgb(0, 0, 0) 1px 0px 1px, rgb(0, 0, 0) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px, rgb(0, 0, 0) -1px 0px 1px;
  line-height: 1.25;
  font-weight: bold;
  overflow: hidden;

  opacity: 0.5;
  & > div {
    display: none;
    position: absolute;
    white-space: pre;
  }
  .danmu-self {
    outline: 2px solid #fff;
  }
}
</style>
