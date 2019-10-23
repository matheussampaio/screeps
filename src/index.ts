import { ActionTreeRunner } from './core'
import { Country, GarbageCollector } from './actions'

export function loop() {
  console.log(`time=${Game.time}`)

  ActionTreeRunner.tick([[Country.name], [GarbageCollector.name]])
}
