import { CreepRole, CreepRoleRegistry } from '@sae/core'
import { ReplaceCreepAction } from '@sae/creep-actions'

@CreepRoleRegistry.register
export class ReplacerCreepRole extends CreepRole {
  defaults() {
    return [[ReplaceCreepAction.name]]
  }
}
