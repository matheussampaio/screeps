import { ScreepsAPI } from 'screeps-api'
import * as dotenv from 'dotenv'

async function main() {
  dotenv.config()

  const screeps = new ScreepsAPI({ token: process.env.SCREEPS_TOKEN })

  screeps.socket.connect()

  screeps.socket.on('connected', () => {
    screeps.socket.on('console', (events) => {
      events.data.messages.log.forEach((log) => console.log(log))
    })

    screeps.socket.subscribe('console')
  })
}

main()
  .catch(error => console.error(error))
