import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from '@sae/core'
import { DieInPeaceCreepAction, UpgradeControllerCreepAction } from '@sae/creep-actions'

@CreepRoleRegistry.register
export class UpgraderControllerCreepRole extends CreepRole {
    body(energy) {
        return new CreateBody({ energy, minimumEnergy: 250 })
            .add([MOVE, WORK, CARRY, MOVE], { move: 2 })
            .addWithMove([WORK, CARRY], { work: 13, carry: 12 })
            .value()
    }

    defaults() {
        return [[UpgradeControllerCreepAction.name], [DieInPeaceCreepAction.name]]
    }
}
