export const isDebug = process.env.NODE_ENV !== 'production' as string
export function uint8ToBase64 (buffer: Uint8Array) {
  let binary = ''
  let len = buffer.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}
export function convertHeader (headers: Headers) {
  let out: any = {}
  for (let key of (headers as any).keys()) {
    out[key] = headers.get(key)
  }
  return out
}
