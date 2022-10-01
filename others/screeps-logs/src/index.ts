import * as _ from 'lodash'
import { ScreepsAPI } from 'screeps-api'

async function main() {
  const serverName = 'localhost'

  const api = await ScreepsAPI.fromConfig(serverName)

  api.socket.connect()

  api.socket.on('connected', () => {
    api.socket.subscribe('console', (events: any) => {
      const messages: string[] = _.get(events, 'data.messages.log', [])

      messages.forEach((log) => console.log(log))
    })
  })
}

main()
  .catch(error => console.error(error))
