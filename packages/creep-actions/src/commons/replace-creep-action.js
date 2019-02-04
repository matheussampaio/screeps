import { Action, ActionRegistry } from '@sae/core'

import { RecycleCreepAction } from './recycle-creep-action'

@ActionRegistry.register
export class ReplaceCreepAction extends Action {
  run(creep) {
    if (creep.memory.subTarget == null) {
      return this.shiftAndContinue()
    }

    const target = Game.getObjectById(creep.memory.subTarget)

    if (target == null) {
      return this.shiftUnshitAndContinue(RecycleCreepAction.name)
    }

    creep.travelTo(target)

    if (creep.pos.isNearTo(target) || target.ticksToLive <= 2) {
      target.dieInPeace(creep)

      creep.memory.substitute = undefined

      return this.shiftAndContinue()
    }

    return this.waitNextTick()
  }
}