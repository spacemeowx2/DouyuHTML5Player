const enum LoadState {
  NotLoaded = 0,
  Loading = 1,
  Loaded = 2,
  Unloading = 3,
}
export interface Unloadable<TS extends any[], R> {
  load (): Promise<void>
  unload (): Promise<void>
  execute (...args: TS): Promise<R>
}
export class IdleUnload<TS extends any[], R> {
  private idleTime: number
  private loaded = false
  private task: Promise<void> = Promise.resolve()
  private running = 0
  private timeoutId: number | undefined
  /**
   * @param obj Unloadable 对象
   * @param idleTime 超时时间 单位为秒
   */
  constructor (private obj: Unloadable<TS, R>, idleTime: number) {
    this.idleTime = idleTime * 1000
  }
  async execute (...args: TS): Promise<R> {
    if (this.timeoutId !== undefined) {
      window.clearTimeout(this.timeoutId)
    }
    await this.doLoad()
    try {
      this.running++
      return await this.obj.execute(...args)
    } finally {
      this.running--
      this.afterRun()
    }
  }
  getFunc () {
    return (...args: TS): Promise<R> => this.obj.execute(...args)
  }
  private afterRun () {
    if (this.running === 0) {
      if (this.timeoutId !== undefined) {
        window.clearTimeout(this.timeoutId)
      }
      this.timeoutId = window.setTimeout(() => this.doUnload(), this.idleTime)
    }
  }
  private async doLoad () {
    await this.append(async () => {
      if (this.loaded === false) {
        await this.obj.load()
        this.loaded = true
      }
    })
  }
  private async doUnload () {
    await this.append(async () => {
      if (this.loaded === true) {
        await this.obj.unload()
        this.loaded = false
      }
    })
  }
  private async append (fac: () => Promise<any>) {
    this.task = this.task.then(fac)
    await this.task
  }
}
/**
 * @param obj Unloadable 对象
 * @param idleTime 超时时间 单位为秒
 */
export function idleUnload<TS extends any[], R> (obj: Unloadable<TS, R>, idleTime: number): (...args: TS) => Promise<R> {
  return (new IdleUnload(obj, idleTime)).getFunc()
}
