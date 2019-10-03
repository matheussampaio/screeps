import * as _ from 'lodash'
import { ActionTreeRunner, ActionsRegistry, IActionConstructor } from './core'
import * as Actions from './actions'
import { BootTree } from './trees'

_.values(Actions)
  .forEach((Action: IActionConstructor) => ActionsRegistry.register(Action))

console.log('running global', Game.time)

export function loop() {
  console.log(`Tick: ${Game.time}`)

  ActionTreeRunner.tick(BootTree)
}
