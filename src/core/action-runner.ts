import * as _ from 'lodash'
import { getCPULimit } from './utils'
import { ACTIONS_RESULT } from './constants'
import { ActionsRegistry } from './actions-registry'
import { Action } from './action'

export interface ActionTree {
  priority: number
  actions: string[][]
  memory: object,
  ranAt?: number,
  name: string
}

declare global {
  interface Memory {
    trees: ActionTree[]
  }
}

export class ActionTreeRunner {
  private static readonly MAX_ITERATIONS = 30

  public static tick(bootActionTree: ActionTree) {
    _.defaults(Memory, { trees: [] })

    const isBootActionTreeCreated = Memory.trees.find((at: ActionTree) => at.name === bootActionTree.name)

    if (!isBootActionTreeCreated) {
      Memory.trees.push(bootActionTree)
    }

    Memory.trees.sort((a, b) => a.priority - b.priority)

    for (const tree of Memory.trees) {
      ActionTreeRunner.run(tree)
    }
  }

  public static run(tree: ActionTree): void {
    for (let subtree of tree.actions) {
      let iterations = 0

      while (subtree.length && iterations++ < ActionTreeRunner.MAX_ITERATIONS && Game.cpu.getUsed() < getCPULimit()) {
        const action: Action = ActionsRegistry.fetch(subtree[0])

        const [result, ...actions] = action.run(tree.memory)

        switch (result) {
            // delete this action and continue with the next
          case ACTIONS_RESULT.SHIFT_AND_CONTINUE:
            subtree.shift()
            continue

            // delete this action and continue with the next subtree
          case ACTIONS_RESULT.SHIFT_AND_STOP:
            subtree.shift()
            break

            // continue with the next subtree
          case ACTIONS_RESULT.WAIT_NEXT_TICK:
            break

            // unshift more actions and continue with the first action
          case ACTIONS_RESULT.UNSHIFT_AND_CONTINUE:
            subtree.unshift(...actions)
            continue

            // unshift more action and continue with the next subtree
          case ACTIONS_RESULT.UNSHIFT_AND_STOP:
            subtree.unshift(...actions)
            break

            // delete this action, unshift more actions and continue with the first action
          case ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE:
            subtree.shift()
            subtree.unshift(...actions)
            continue

            // delete this action, unshift more actions and continue with the next subtree
          case ACTIONS_RESULT.SHIFT_UNSHIFT_AND_STOP:
            subtree.shift()
            subtree.unshift(...actions)
            break
        }
      }
    }
  }
}
