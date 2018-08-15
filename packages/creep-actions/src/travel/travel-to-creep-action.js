import { Action, ActionRegistry } from '@sae/core'

@ActionRegistry.register
export class TravelToCreepAction extends Action {
  run(creep) {
    if (creep.memory.travelTo == null) {
      return this.shiftAndStop()
    }

    const target = Game.getObjectById(creep.memory.travelTo)

    if (target == null) {
      return this.shiftAndContinue()
    }

    const range = creep.memory.range == null ? 1 : creep.memory.range

    if (creep.pos.getRangeTo(target.pos) > range) {
      creep.travelTo(target)

      return this.waitNextTick()
    }

    delete creep.memory.range
    delete creep.memory.travelTo
    delete creep.memory._trav

    return this.shiftAndContinue()
  }
}
