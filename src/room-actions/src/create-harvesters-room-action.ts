import { Action, ActionRegistry, CreepRoleRegistry } from '../../engine'
import { CourierCreepRole, HarvesterEnergyCreepRole, HaulerEnergyCreepRole } from '../../creep-roles'


@ActionRegistry.register
export class CreateHarvestersRoomAction extends Action {
    run(room: Room) {
        const harvesters = _.get(room, ['creeps', HarvesterEnergyCreepRole.name, 'length'], 0)

        if (harvesters < _.size(room.memory.sources)) {
            CreepRoleRegistry.fetch(HarvesterEnergyCreepRole.name).queue(room)
        }

        const haulers = _.get(room, ['creeps', HaulerEnergyCreepRole.name, 'length'], 0)
        const links =  _.size(_.get(room, 'memory.links.sources', {}))

        if (haulers < _.size(room.memory.sources) - links) {
            CreepRoleRegistry.fetch(HaulerEnergyCreepRole.name).queue(room)
        }

        if (room.storage && room.creeps.Courier == null) {
            CreepRoleRegistry.fetch(CourierCreepRole.name).queue(room)
        }

        return this.waitNextTick()
    }
}
