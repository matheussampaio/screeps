import { Action, ActionRegistry, CreepRoleRegistry } from '@sae/core'
import { UpgraderControllerCreepRole } from '@sae/creep-roles'

@ActionRegistry.register
export class CreateUpgradersRoomAction extends Action {
  run(room) {
    const upgraders = _.get(room, ['creeps', UpgraderControllerCreepRole.name, 'length'], 0)

    if (upgraders < 2) {
      CreepRoleRegistry.fetch(UpgraderControllerCreepRole.name).queue(room)
    }

    return this.waitNextTick()
  }
}
