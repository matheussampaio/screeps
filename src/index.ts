import { ActionTreeRunner } from './core'
import { Country, GarbageCollector } from './actions'

export function loop() {
  ActionTreeRunner.tick([[Country.name], [GarbageCollector.name]])
}
