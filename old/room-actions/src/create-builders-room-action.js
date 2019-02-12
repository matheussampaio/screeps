import { Action, ActionRegistry, CreepRoleRegistry } from '@sae/core'
import { BuilderCreepRole } from '@sae/creep-roles'

@ActionRegistry.register
export class CreateBuildersRoomAction extends Action {
  run(room) {
    const upgraders = _.get(room, ['creeps', BuilderCreepRole.name, 'length'], 0)

    if (upgraders < 2) {
      CreepRoleRegistry.fetch(BuilderCreepRole.name).queue(room)
    }

    return this.waitNextTick()
  }
}
