import * as _ from 'lodash'
import { ScreepsAPI } from 'screeps-api'
import * as dotenv from 'dotenv'

async function main() {
  dotenv.config()

  const options = getOptions()

  const screeps = new ScreepsAPI(options)

  await screeps.auth()

  screeps.socket.connect()

  screeps.socket.on('connected', () => {
    screeps.socket.on('console', (events) => {
      const messages = _.get(events, 'data.messages.log', [])

      messages.forEach((log: any) => console.log(log))
    })

    screeps.socket.subscribe('console')
  })
}

function getOptions() {
  if (process.env.SCREEPS_PRIVATE_SERVER) {
    return {
      protocol: 'http',
      hostname: 'localhost',
      port: 21025,
      password: process.env.SCREEPS_PASSWORD,
      email: process.env.SCREEPS_EMAIL,
      branch: process.env.SCREEPS_BRANCH || 'default'
    }
  }

  return {
    token: process.env.SCREEPS_TOKEN,
    branch: process.env.SCREEPS_BRANCH || 'default'
  }
}

main()
  .catch(error => console.error(error))
