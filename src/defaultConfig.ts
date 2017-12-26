export type YesNoRemember = 'y' | 'n' | 'r'
export const DefaultConfig  = {
  userStyle: 
`.danmu-layout { 
  color: #fff;
  font-size: 25px;
  font-family: SimHei, "Microsoft JhengHei", Arial, Helvetica, sans-serif;
  text-shadow: rgb(0, 0, 0) 1px 0px 1px, rgb(0, 0, 0) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px, rgb(0, 0, 0) -1px 0px 1px;
  line-height: 1.25;
  font-weight: bold;
}`,
  displayDanmu: 'y' as YesNoRemember,
  maxDanmu: 200,
  maxDanmuPerSec: -1,
  mergeDanmu: true,
}
