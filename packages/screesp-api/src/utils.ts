import zlib from 'zlib'

export function isCompressed(data: string) {
  return data.slice(0, 3) === 'gz:'
}

export function inflate(data: string) {
  const buffer = zlib.gunzipSync(Buffer.from(data.slice(3), 'base64'))

  return buffer.toString()
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
