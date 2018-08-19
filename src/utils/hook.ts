import { runtimePort, PostFunction } from 'utils/port'
import { object2Header, base64ToUint8 } from 'utils/helper'

let hooked = false
class PortReader {
  hasReader: boolean
  constructor (private post: PostFunction) {
    this.hasReader = false
  }
  async _requireReader () {
    if (!this.hasReader) {
      await this.post('body.getReader')
      this.hasReader = true
    }
  }
  async read () {
    await this._requireReader()
    let r: ReaderResult<Uint8Array | string> = await this.post('reader.read')
    if (r.done == false) {
      r.value = base64ToUint8(r.value as string)
    }
    return r as ReaderResult<Uint8Array>
  }
  async cancel () {
    await this._requireReader()
    this.post('reader.cancel')
  }
}
function portBody (post: PostFunction) {
  return {
    getReader () {
      return new PortReader(post)
    }
  }
}
async function portFetch (...args: any[]) {
  const post = runtimePort('fetch')
  let r: any = await post('fetch', args)

  r.json = () => post('json')
  r.arrayBuffer = async () => new Uint8Array(await post('arrayBuffer')).buffer

  r.headers = object2Header(r.headers)
  r.body = portBody(post)
  return r
}
const handler: ProxyHandler<Window> = {
  get (target: any, p: PropertyKey, receiver: any): any {
    if (p === 'fetch') {
      return portFetch
    }
    return target[p]
  }
}
export function hookFetch () {
  if (hooked) {
    return
  }
  hooked = true

  const newSelf = new Proxy(self, handler)
  self = newSelf
}
