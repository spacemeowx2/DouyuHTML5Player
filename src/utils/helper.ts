export const isDebug = process.env.NODE_ENV !== 'production' as string
export function uint8ToBase64 (buffer: Uint8Array) {
  let binary = ''
  let len = buffer.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}
export function base64ToUint8 (b64: string) {
  const s = atob(b64)
  const length = s.length
  let ret = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    ret[i] = s.charCodeAt(i)
  }
  return ret
}
export function header2Object (headers: Headers) {
  let out: any = {}
  for (let key of (headers as any).keys()) {
    out[key] = headers.get(key)
  }
  return out
}
export function object2Header (obj: any) {
  let out = new Headers()
  for (let key of Object.keys(obj)) {
    out.set(key, obj[key])
  }
  return out
}
