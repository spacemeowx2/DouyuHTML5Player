const magicSpace = (window as any).$$space$$
export interface PortHandler<T> {
  onDisconnect(): void
  onMessage(msg: T): void
}
export interface Port {
  postMessage<T = any>(msg: T): void
  disconnect(): void
}
export function runtimeConnect (name: string) {
  if (magicSpace) {
    return chrome.runtime.connect(magicSpace.extensionId, { name })
  } else {
    return chrome.runtime.connect({ name })
  }
}
export function runtimeGetUrl (path: string) {
  return chrome.runtime.getURL(path)
}
