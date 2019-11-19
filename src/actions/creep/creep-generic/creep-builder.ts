import * as _ from 'lodash'

import { ActionsRegistry, Action  } from '../../../core'
import { ICreepGenericContext } from './interfaces'
import { CreepUpgradeController } from './creep-upgrade-controller'

@ActionsRegistry.register
export class CreepBuilder extends Action {
  run(context: ICreepGenericContext) {
    const creep: Creep | undefined = Game.creeps[context.creepName]

    if (creep == null) {
      return this.shiftAndStop()
    }

    const isEmpty = _.sum(_.values(creep.carry)) === 0

    if (isEmpty) {
      return this.shiftAndContinue()
    }

    const target: any = this.getConstructionTarget(creep, context)

    if (target == null) {
      return this.shiftUnshitAndContinue(CreepUpgradeController.name)
    }

    if (creep.pos.inRangeTo(target, 3)) {
      creep.build(target)
    } else {
      creep.travelTo(target, { range: 1, ignoreCreeps: true })
    }

    return this.waitNextTick()
  }

  getConstructionTarget(creep: Creep, context: ICreepGenericContext): any {
    if (context.target) {
      const target: any = Game.getObjectById(context.target)

      if (target) {
        return target
      }
    }

    const room = Game.rooms[creep.memory.roomName]

    if (room == null) {
      return null
    }

    const targets = room.find(FIND_MY_CONSTRUCTION_SITES).sort((c1, c2) => c2.progress - c1.progress);

    if (targets.length === 0) {
      return null
    }

    context.target = targets[0].id as string

    return targets[0]
  }
}


