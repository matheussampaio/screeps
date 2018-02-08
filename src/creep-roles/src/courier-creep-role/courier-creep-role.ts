import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from "../../../engine"
import {
    DieInPeaceCreepAction,
    EmptyStorageLinkCreepAction,
    FillCourierTargetCreepAction
} from "../../../creep-actions"

@CreepRoleRegistry.register
export class CourierCreepRole extends CreepRole {
    body(energy: number): string {
        return new CreateBody({ energy, minimumEnergy: 100 })
            .addWithMove(CARRY, { carry: 2 })
            .addWithMove(WORK)
            .addWithMove([CARRY, WORK], { carry: 20, work: 5 })
            .value()
    }

    defaults(): string[][] {
        return [[EmptyStorageLinkCreepAction.name, FillCourierTargetCreepAction.name], [DieInPeaceCreepAction.name]]
    }
}
