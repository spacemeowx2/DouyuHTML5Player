export const douyuOptions = {
  preferRate: '0',
  disableSocket: false,
  ignoreLevelBelow: -1,
  wordBlacklist: [] as string[],
  showManagerNameInDanmu: false,
}
export const commonOptions = {
  userStyle: 
`.danmu-layout { 
  color: #fff;
  font-size: 25px;
  font-family: SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif;
  text-shadow: rgb(0, 0, 0) 1px 0px 1px, rgb(0, 0, 0) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px, rgb(0, 0, 0) -1px 0px 1px;
  line-height: 1.25;
  font-weight: bold;
}`,
  displayDanmu: true,
  maxDanmu: 200,
  maxDanmuPerSec: -1,
  mergeDanmu: true,
}
export const appOptions = {
  common: commonOptions,
  douyu: douyuOptions
}
export type OptionTypes = 'textarea' | ''
type AppOptionsType = typeof appOptions
type SectionType<T> = {
  [key in keyof T]: {
    name: string,
    type?: OptionTypes
  }
}
type OptionsTypeType<T> = {
  [key in keyof T]: SectionType<T[key]>
}
export const appOptionTypes: OptionsTypeType<AppOptionsType> = {
  common: {
    userStyle: {
      name: '自定义样式',
      type: 'textarea'
    },
    displayDanmu: {
      name: '显示弹幕'
    },
    maxDanmu: {
      name: '同屏最大弹幕数量'
    },
    maxDanmuPerSec: {
      name: '每秒弹幕数量限制'
    },
    mergeDanmu: {
      name: '合并弹幕'
    },
  },
  douyu: {
    preferRate: {
      name: '优先清晰度'
    },
    disableSocket: {
      name: '禁用弹幕连接(无法送礼)'
    },
    ignoreLevelBelow: {
      name: '忽略低于该等级的弹幕'
    },
    wordBlacklist: {
      name: '屏蔽关键字'
    },
    showManagerNameInDanmu: {
      name: '在弹幕中显示房管主播ID'
    },
  }
}
