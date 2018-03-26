import { Action } from '../model'

export class ActionRegistry {
  static register(constructor) {
    ActionRegistry.registry[constructor.name] = new constructor()
  }

  static fetch(name) {
    return ActionRegistry.registry[name]
  }
}

ActionRegistry.registry = {}
