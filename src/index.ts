import * as _ from 'lodash'

import { ActionTreeRunner, ActionsRegistry, IActionConstructor } from './core'
import * as Actions from './actions'

_.values(Actions)
  .forEach((Action: IActionConstructor) => ActionsRegistry.register(Action))

export function loop() {
  console.log(`time=${Game.time}`)

  ActionTreeRunner.tick([[Actions.Country.name]])
}
