import { runtimeConnect } from './extension'

export type PostFunction<T = any> = (method: string, ...args: any[]) => Promise<T>
export function runtimePort (name: string) {
  const port: chrome.runtime.Port = runtimeConnect(name)
  let curMethod = ''
  let curResolve: Function | null = null
  let curReject: Function | null = null
  let stack: string | undefined = ''
  let lastDone = true
  const onMessage = (msg: { method: string, args: any[], err?: Error }) => {
    if (msg.method === curMethod) {
      if (msg.err) {
        let err = new Error(msg.err.message)
        err.stack = stack
        curReject!(err)
      } else {
        curResolve!(...msg.args)
      }
      curResolve = null
      curReject = null
      lastDone = true
    } else {
      console.error('wtf?')
    }
  }
  port.onMessage.addListener((msg: any) => onMessage(msg))
  return function post<T = any> (method: string, ...args: any[]): Promise<T> {
    if (!lastDone) {
      throw new Error('Last post is not done')
    }
    stack = new Error().stack
    return new Promise((resolve, reject) => {
      lastDone = false
      curMethod = method
      curResolve = resolve
      curReject = reject
      port.postMessage({
        method,
        args
      })
    })
  }
}
