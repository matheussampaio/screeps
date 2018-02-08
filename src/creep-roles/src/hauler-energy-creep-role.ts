import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from "../../engine"
import { DieInPeaceCreepAction, HaulerEnergyCreepAction } from "../../creep-actions"

@CreepRoleRegistry.register
export class HaulerEnergyCreepRole extends CreepRole {
    body(energy: number): string {
        return new CreateBody({ energy, minimumEnergy: 250 })
            .add([MOVE, CARRY, WORK, MOVE])
            .addWithMove(CARRY, { carry: 2 })
            .addWithMove([CARRY, WORK], { carry: 20, work: 5 })
            .value()
    }

    defaults(): string[][] {
        return [[HaulerEnergyCreepAction.name], [DieInPeaceCreepAction.name]]
    }

    priority(harvesterAlive: number): Priority {
        if (harvesterAlive === 0) {
            return Priority.VERY_HIGH
        }

        return Priority.NORMAL
    }
}
