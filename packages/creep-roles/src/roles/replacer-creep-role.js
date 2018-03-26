import { CreateBody, CreepRole, CreepRoleRegistry, Priority } from '@sae/core'
import { DieInPeaceCreepAction, ReplaceCreepAction } from '@sae/creep-actions'

@CreepRoleRegistry.register
export class ReplacerCreepRole extends CreepRole {
  defaults() {
    return [[ReplaceCreepAction.name]]
  }
}
