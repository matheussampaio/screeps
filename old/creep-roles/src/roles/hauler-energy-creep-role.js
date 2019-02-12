import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from '@sae/core'
import { DieInPeaceCreepAction, HaulerEnergyCreepAction } from '@sae/creep-actions'

@CreepRoleRegistry.register
export class HaulerEnergyCreepRole extends CreepRole {
  body(energy) {
    return new CreateBody({ energy, minimumEnergy: 250 })
      .add([MOVE, CARRY, WORK, MOVE])
      .addWithMove(CARRY, { carry: 2 })
      .addWithMove([CARRY, WORK], { carry: 20, work: 5 })
      .value()
  }

  defaults() {
    return [[HaulerEnergyCreepAction.name], [DieInPeaceCreepAction.name]]
  }

  priority(harvesterAlive) {
    if (harvesterAlive === 0) {
      return Priority.VERY_HIGH
    }

    return Priority.NORMAL
  }
}
