import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from '@sae/core'
import { DieInPeaceCreepAction, HarvesterEnergy } from '@sae/creep-actions'

@CreepRoleRegistry.register
export class HarvesterEnergyCreepRole extends CreepRole {
  body(energy) {
    return new CreateBody({ energy, minimumEnergy: 150 })
      .addWithMove([WORK], { work: 2 })
      .add(CARRY)
      .add(WORK, { work: 7 })
      .add(MOVE, { move: 7 })
      .value()
  }

  defaults() {
    return [[HarvesterEnergy.name], [DieInPeaceCreepAction.name]]
  }

  priority(harvesterAlive) {
    if (harvesterAlive === 0) {
      return Priority.VERY_HIGH
    }

    return Priority.NORMAL
  }
}
