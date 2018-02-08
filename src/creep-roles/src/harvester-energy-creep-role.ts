import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from "../../engine"
import { DieInPeaceCreepAction, HarvesterEnergy } from "../../creep-actions"

@CreepRoleRegistry.register
export class HarvesterEnergyCreepRole extends CreepRole {
    body(energy: number): string {
        return new CreateBody({ energy, minimumEnergy: 150 })
            .addWithMove([WORK], { work: 2 })
            .add(CARRY)
            .add(WORK, { work: 7 })
            .add(MOVE, { move: 7 })
            .value()
    }

    defaults(): string[][] {
        return [[HarvesterEnergy.name], [DieInPeaceCreepAction.name]]
    }

    priority(harvesterAlive: number): Priority {
        if (harvesterAlive === 0) {
            return Priority.VERY_HIGH
        }

        return Priority.NORMAL
    }
}
