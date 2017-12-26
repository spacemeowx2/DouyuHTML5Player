export interface IStorage {
  set (key: string, val: string): Promise<void>
  get (key: string): Promise<string>
}
export class Config<T> {
  constructor (private defaultValues: T, private storage: IStorage) {}
  async set<K extends keyof T> (key: K, value: T[K]): Promise<void> {
    await this.storage.set(key, JSON.stringify(value))
  }
  async get<K extends keyof T> (key: K): Promise<T[K]> {
    let ret = await this.storage.get(key)
    if (ret === undefined) {
      return this.defaultValues[key]
    } else {
      return JSON.parse(ret)
    }
  }
}
