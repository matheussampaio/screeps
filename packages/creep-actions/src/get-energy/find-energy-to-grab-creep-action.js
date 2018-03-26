import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class FindEnergyToGrabCreepAction extends Action {
  run(creep) {
    // try to pickup dropped energy
    const resource = _.sample(creep.room.find(FIND_DROPPED_RESOURCES))

    if (resource != null) {
      creep.memory.energy = resource.id

      return this.shiftAndContinue()
    }

    // try to find a container
    const containers = creep.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.energy > 0
    })

    // get the container with more energy
    const container = _.max(containers, container => {
      return container.store.energy
    })

    if (container instanceof StructureContainer && container != null) {
      creep.memory.energy = container.id

      return this.shiftAndContinue()
    }

    return this.waitNextTick()
  }
}
