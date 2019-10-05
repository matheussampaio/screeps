import * as _ from 'lodash'
import { ActionTreeRunner, ActionsRegistry, IActionConstructor } from './core'
import * as Actions from './actions'
import { BootTree } from './trees'

_.values(Actions)
  .forEach((Action: IActionConstructor) => ActionsRegistry.register(Action))

export function loop() {
  ActionTreeRunner.tick(BootTree)
}
