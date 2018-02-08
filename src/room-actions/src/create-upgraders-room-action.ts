import { Action, ActionRegistry, CreepRoleRegistry } from '../../engine'
import { UpgraderControllerCreepRole } from '../../creep-roles'

@ActionRegistry.register
export class CreateUpgradersRoomAction extends Action {
    run(room: Room) {
        const upgraders = _.get(room, ['creeps', UpgraderControllerCreepRole.name, 'length'], 0)

        if (upgraders < 2) {
            CreepRoleRegistry.fetch(UpgraderControllerCreepRole.name).queue(room)
        }

        return this.waitNextTick()
    }
}
