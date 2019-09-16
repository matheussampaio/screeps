import axios, { AxiosInstance } from 'axios'

import * as utils from './utils'

class Screeps {
  private axios: AxiosInstance

  constructor({ token = '' } = {}) {
    this.axios = axios.create({
      baseURL: 'https://screeps.com/api',
      headers: {
        'X-Token': token
      },
      transformResponse: [
        JSON.parse,
        data => {
          if (data.data && utils.isCompressed(data.data)) {
            data.data = utils.inflate(data.data)
          }

          return data
        }
      ]
    })
  }

  public async getMemory({ path, shard = 'shard0' }: { path: string; shard: string }) {
    const response = await this.axios.get('/user/memory', {
      params: { path, shard }
    })

    return response.data.data
  }
}

module.exports = Screeps
