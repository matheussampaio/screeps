import { ActionTree, PRIORITY } from '../core'
import { Harvester } from '../actions'

export const BootTree: ActionTree = {
  name: 'boot-tree',
  priority: PRIORITY.HIGH,
  memory: {},
  actions: [
    [Harvester.name]
  ]
}
