import { Action } from '../model'
import { ActionRegistry } from '../registry'
import { ActionReturn, getCpuLimit, Stats } from '../util'

const SAFE_ACTIONS_INTERATIONS = 10
const DEBUG = false

export class ActionRunner {
  static setDefaultAction(agent, defaults) {
    if (agent.memory.actions == null) {
      agent.memory.actions = _.cloneDeep(defaults)
    }

    for (let i = 0; i < defaults.length; i++) {
      if (agent.memory.actions[i] == null || agent.memory.actions[i].length <= 0) {
        if (agent.memory.DEBUG) {
          console.log(`Empty group (${i}), setting default:`, defaults[i])
        }

        agent.memory.actions[i] = _.cloneDeep(defaults[i])
      } else if (agent.memory.actions[i].length >= SAFE_ACTIONS_INTERATIONS) {
        console.log(`WARN: to much actions (${agent.memory.actions[i].length}), reseting...`)

        agent.memory.actions[i] = _.cloneDeep(defaults[i])
      }
    }
  }

  static breakResult(actionsResult) {
    let parserResult = {
      result: actionsResult,
      actions: []
    }

    // inside the actions, we can return an Array or a String
    if (_.isArray(actionsResult)) {
      parserResult = {
        result: actionsResult[0],
        actions: actionsResult.slice(1)
      }
    }

    return parserResult
  }

  static runGroup(agent, group) {
    // make sure we don't get a infinty loop
    let times = 0

    if (agent.memory.DEBUG) {
      console.log('running group:', JSON.stringify(group))
    }

    // for each action in the group
    while (group.length) {
      times += 1

      const action = ActionRegistry.fetch(group[0])

      if (times >= SAFE_ACTIONS_INTERATIONS) {
        console.log('Too many interations, stoppping...', group[0])
        break
      }

      if (Game.cpu.getUsed() >= getCpuLimit()) {
        console.log('Too much CPU used, stopping...')
        break
      }

      // check if actions exists
      if (action == null) {
        console.log('action missing', group[0])
        break
      }

      if (agent.memory.DEBUG) {
        console.log('\trunning action:', group[0])
      }

      let actionsResult

      try {
        actionsResult = action.run(agent)
      } catch (error) {
        console.log('ERROR:', group[0], error.stack)
        break
      }

      const { result, actions } = ActionRunner.breakResult(actionsResult)

      // delete this action and continue with the next
      if (result === ActionReturn.SHIFT_AND_CONTINUE) {
        group.shift()
        continue

        // delete this action and continue with the next group
      } else if (result === ActionReturn.SHIFT_AND_STOP) {
        group.shift()
        break

        // continue with the next group
      } else if (result === ActionReturn.WAIT_NEXT_TICK) {
        break

        // unshift more actions and continue with the first action
      } else if (result === ActionReturn.UNSHIFT_AND_CONTINUE) {
        group.unshift(...actions)
        continue

        // unshift more action and continue with the next group
      } else if (result === ActionReturn.UNSHIFT_AND_STOP) {
        group.unshift(...actions)
        break

        // delete this action, unshift more actions and continue with the first action
      } else if (result === ActionReturn.SHIFT_UNSHIFT_AND_CONTINUE) {
        group.shift()
        group.unshift(...actions)
        continue

        // delete this action, unshift more actions and continue with the next group
      } else if (result === ActionReturn.SHIFT_UNSHIFT_AND_STOP) {
        group.shift()
        group.unshift(...actions)
        break

        // continue with the next group
      } else {
        break
      }
    }
  }

  static runGroups(agent) {
    // for each group of actions
    for (let i = 0; i < agent.memory.actions.length; i++) {
      let group = agent.memory.actions[i]

      if (_.isString(group)) {
        if (agent.memory.DEBUG) {
          console.log(`String group found (${i}), changing to array:`, group)
        }
        group = agent.memory.actions[i] = [group]
      }

      ActionRunner.runGroup(agent, group)
    }
  }

  static run(agent, defaults) {
    if (agent.memory.DEBUG) {
      console.log('============\nRunning agent:', agent.name)
      console.log('actions:', JSON.stringify(agent.memory.actions))
    }

    ActionRunner.setDefaultAction(agent, defaults)
    ActionRunner.runGroups(agent)
  }
}
