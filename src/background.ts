import FlashEmu from 'flash-emu'

FlashEmu.BUILTIN = 'dist/builtin.abc'
FlashEmu.PLAYERGLOBAL = 'dist/playerglobal.abc'
FlashEmu.setGlobalFlags({
  enableDebug: false,
  enableLog: false,
  enableWarn: false,
  enableError: false
})
