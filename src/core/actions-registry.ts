import * as _ from 'lodash'

import { Action, IActionConstructor } from './action'

export class ActionsRegistry {
  private static registry: { [name: string]: Action } = {}

  public static register(Action: IActionConstructor) {
    ActionsRegistry.registry[Action.name] = new Action()
  }

  public static fetch(name: string): Action {
    const action = ActionsRegistry.registry[name]

    if (action == null) {
      throw new Error(`Action Not Found: ${name}, [${_.keys(ActionsRegistry.registry)}]`)
    }

    return action
  }
}
