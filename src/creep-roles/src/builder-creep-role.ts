import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from '../../engine'
import { BuilderCreepAction, DieInPeaceCreepAction } from '../../creep-actions'


@CreepRoleRegistry.register
export class BuilderCreepRole extends CreepRole {
    body(energy: number): string {
        return new CreateBody({ energy, minimumEnergy: 250 })
            .add([MOVE, WORK, CARRY, MOVE], { move: 2 })
            .addWithMove([WORK, CARRY], { work: 13, carry: 12 })
            .value()
    }

    defaults(): string[][] {
        return [
            [BuilderCreepAction.name],
            [DieInPeaceCreepAction.name]
        ]
    }
}
