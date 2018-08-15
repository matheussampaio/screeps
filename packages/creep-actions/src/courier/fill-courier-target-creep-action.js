import { Action, ActionRegistry } from '@sae/core'
import { FindCourierTargetCreepAction } from './find-courier-target-creep-action'
import { GetEnergyOnlyFromStoragetCreepAction } from './get-energy-only-from-storaget-creep-action'

@ActionRegistry.register
export class FillCourierTargetCreepAction extends Action {
  run(creep) {
    if (creep.carry.energy === 0) {
      return this.unshiftAndContinue(GetEnergyOnlyFromStoragetCreepAction.name)
    }

    const target = Game.getObjectById(creep.memory.target)

    // TODO: Find transfer target should be an action
    if (target == null || target.isFull()) {
      return this.unshiftAndContinue(FindCourierTargetCreepAction.name)
    }

    const result = creep.transfer(target, RESOURCE_ENERGY)

    if (result === OK) {
      delete creep.memory.target

      return this.shiftAndStop()
    }

    if (result === ERR_NOT_IN_RANGE) {
      creep.travelTo(target)
    }

    if (result === ERR_INVALID_TARGET) {
      delete creep.memory.target
    }

    if (result === ERR_FULL) {
      delete creep.memory.target
    }

    return this.shiftAndStop()
  }
}
