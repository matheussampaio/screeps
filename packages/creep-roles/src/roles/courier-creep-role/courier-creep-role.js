import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from '@sae/core'
import {
    EmptyStorageLinkCreepAction,
    FillCourierTargetCreepAction
} from '@sae/creep-actions'

@CreepRoleRegistry.register
export class CourierCreepRole extends CreepRole {
    body(energy) {
        return new CreateBody({ energy, minimumEnergy: 100 })
            .addWithMove(CARRY, { carry: 2 })
            .addWithMove(WORK)
            .addWithMove([CARRY, WORK], { carry: 20, work: 5 })
            .value()
    }

    defaults() {
        return [[EmptyStorageLinkCreepAction.name, FillCourierTargetCreepAction.name], [DieInPeaceCreepAction.name]]
    }
}
