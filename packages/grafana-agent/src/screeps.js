const axios = require('axios')

const utils = require('./utils')

class Screeps {
  constructor({ token } = {}) {
    this.axios = axios.create({
      baseURL: 'https://screeps.com/api',
      headers: {
        'X-Token': token
      },
      transformResponse: [JSON.parse, data => {
        if (data.data && utils.isCompressed(data.data)) {
          data.data = utils.inflate(data.data)
        }

        return data
      }]
    })
  }

  async getMemory({ path, shard = 'shard0' }) {
    const response = await this.axios.get('/user/memory', {
      params: { path, shard }
    })

    return response.data.data
  }
}

module.exports = Screeps
