import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class FindMovementTarget extends Action {
  run(creep) {
    const source = Game.getObjectById(creep.memory.source)

    if (source == null) {
      creep.memory.source = undefined
      return this.shiftAndStop()
    }

    // if not working yet
    const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => {
        return s.structureType === STRUCTURE_CONTAINER
      }
    })

    if (containers && containers.length) {
      creep.memory.target = containers[0].pos
      return this.shiftAndContinue()
    }

    const containersInConstructions = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })

    if (containersInConstructions && containersInConstructions.length) {
      creep.memory.target = containersInConstructions[0].pos
      return this.shiftAndContinue()
    }

    const path = creep.pos.findPathTo(source)

    creep.memory.target = path[path.length - 2]

    return this.shiftAndContinue()
  }
}
