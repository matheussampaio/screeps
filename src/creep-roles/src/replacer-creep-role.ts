import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from '../../engine'
import { DieInPeaceCreepAction, ReplaceCreepAction } from '../../creep-actions'


@CreepRoleRegistry.register
export class ReplacerCreepRole extends CreepRole {
    defaults(): string[][] {
        return [
            [ReplaceCreepAction.name]
        ]
    }
}
