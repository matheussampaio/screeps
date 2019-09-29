const axios = require('axios')
const dotenv = require('dotenv')

const utils = require('./utils')
const ScreepsAPI = require('../../screesp-api/src/screeps-api')

main()

async function main() {
  dotenv.config()

  const screeps = new ScreepsAPI({ token: process.env.SCREEPS_TOKEN })

  const shards = (process.env.SCREEPS_SHARDS || 'shard0').split(',')

  const interval = process.env.SCREEPS_SEGMENT ? (15000 * shards.length) : 60000

  while (true) {
    for (let i = 0; i < shards.length; i++) {
      await tick(shards[i], screeps)
    }

    await utils.sleep(interval)
  }
}

async function tick (shard, screeps) {
  console.log(`Fetching Stats (${shard})`)

  const stats = await screeps.getMemory({ path: 'stats', shard })

  if (!stats) {
    return console.info('No stats found, is Memory.stats defined?')
  }

  if (process.env.PRINT_RAW_STATS) {
    console.log('Stats:', stats)
  }

  return pushStats(stats)
}

function pushStats (stats) {
  const url = `${process.env.GRAFANA_URL}/api/stats/submit`
  const options = {
    headers: {
      'Content-Type': 'application/json'
    },
    auth: {
      user: 'token',
      pass: process.env.GRAFANA_TOKEN
    },
    body: stats
  }

  return axios.post(url, options)
    .then(response => console.log('Result:', response.data))
    .catch(error => console.error(error.response.data))
}
