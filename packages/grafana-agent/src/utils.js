const zlib = require('zlib')

function isCompressed(data) {
  return data.slice(0, 3) === 'gz:'
}

function inflate(data) {
  const buffer = zlib.gunzipSync(Buffer.from(data.slice(3), 'base64'))

  return buffer.toString()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { isCompressed, inflate, sleep }
