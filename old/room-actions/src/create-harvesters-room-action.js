import { Action, ActionRegistry, CreepRoleRegistry } from '@sae/core'
import { CourierCreepRole, HarvesterEnergyCreepRole, HaulerEnergyCreepRole } from '@sae/creep-roles'

@ActionRegistry.register
export class CreateHarvestersRoomAction extends Action {
  run(room) {
    const harvesters = _.get(room, ['creeps', HarvesterEnergyCreepRole.name, 'length'], 0)

    if (harvesters < _.size(room.memory.sources)) {
      CreepRoleRegistry.fetch(HarvesterEnergyCreepRole.name).queue(room)
    }

    const haulers = _.get(room, ['creeps', HaulerEnergyCreepRole.name, 'length'], 0)
    const links = _.size(_.get(room, 'memory.links.sources', {}))

    if (haulers < (_.size(room.memory.sources) - links) * 2) {
      CreepRoleRegistry.fetch(HaulerEnergyCreepRole.name).queue(room)
    }

    const couriers = _.get(room, ['creeps', CourierCreepRole.name, 'length'], 0)

    if (room.storage && couriers === 0) {
      CreepRoleRegistry.fetch(CourierCreepRole.name).queue(room)
    }

    return this.waitNextTick()
  }
}
