import { Action, ActionRegistry, CreepRoleRegistry } from '../../engine'
import { BuilderCreepRole } from '../../creep-roles'

@ActionRegistry.register
export class CreateBuildersRoomAction extends Action {
    run(room: Room) {
        const upgraders = _.get(room, ['creeps', BuilderCreepRole.name, 'length'], 0)

        if (upgraders < 2) {
            CreepRoleRegistry.fetch(BuilderCreepRole.name).queue(room)
        }

        return this.waitNextTick()
    }
}
