import Vue from 'vue'

export const RateKey = 'rate'
export type Option = {
  key: string
  display: string
  subOptions?: Option[]
}
export abstract class BaseSource {
  private _vm = new Vue({
    data: {
      loading: false,
      src: '',
      options: [] as Option[]
    }
  })
  constructor (options: Option[]) {
    this._vm.options = options
  }
  abstract init (): Promise<void>
}
