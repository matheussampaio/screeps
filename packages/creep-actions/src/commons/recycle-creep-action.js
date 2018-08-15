import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class RecycleCreepAction extends Action {
  run(creep) {
    if (creep.memory.spawn == null) {
      const spawn = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_SPAWN
      })

      creep.memory.spawn = spawn.id
    }

    const spawn = Game.getObjectById(creep.memory.spawn)

    if (spawn == null) {
      delete creep.memory.spawn

      return this.waitNextTick()
    }

    if (creep.pos.isNearTo(spawn)) {
      spawn.recycleCreep(creep)
    } else {
      creep.travelTo(spawn)
    }

    return this.waitNextTick()
  }
}
