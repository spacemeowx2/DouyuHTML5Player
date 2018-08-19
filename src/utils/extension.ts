export interface PortHandler<T> {
  onDisconnect(): void
  onMessage(msg: T): void
}
export interface Port {
  postMessage<T = any>(msg: T): void
  disconnect(): void
}
