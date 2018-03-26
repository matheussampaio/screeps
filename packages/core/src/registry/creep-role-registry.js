import { CreepRole } from '../model'

export class CreepRoleRegistry {
  static register(constructor) {
    CreepRoleRegistry.registry[constructor.name] = new constructor()
  }

  static fetch(name) {
    return CreepRoleRegistry.registry[name]
  }
}

CreepRoleRegistry.registry = {}
