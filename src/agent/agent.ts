import { IAction } from '../interfaces'
import { getCpuLimit } from '../utils'
import { ActionsRegistry } from './actions-registry'

export class Agent {
    public static readonly SHIFT_AND_CONTINUE = 'SHIFT_AND_CONTINUE'
    public static readonly SHIFT_AND_STOP = 'SHIFT_AND_STOP'
    public static readonly WAIT_NEXT_TICK = 'WAIT_NEXT_TICK'
    public static readonly UNSHIFT_AND_CONTINUE = 'UNSHIFT_AND_CONTINUE'
    public static readonly UNSHIFT_AND_STOP = 'UNSHIFT_AND_STOP'
    public static readonly SHIFT_UNSHIFT_AND_CONTINUE = 'SHIFT_UNSHIFT_AND_CONTINUE'
    public static readonly SHIFT_UNSHIFT_AND_STOP = 'SHIFT_UNSHIFT_AND_STOP'
    public static readonly SAFE_ACTIONS_INTERATIONS = 30

    public static readonly DEBUG = false

    public static run(agent: any, defaults: string[][]) {
        if (Agent.DEBUG) {
            console.log('\nRunning agent:', agent)
            console.log('actions:', agent.memory.actions)
        }

        _.defaults(agent.memory, {
            actions: _.cloneDeep(defaults)
        })

        for (let i = 0; i < defaults.length; i++) {
            if (agent.memory.actions[i] == null || agent.memory.actions[i].length <= 0) {
                if (Agent.DEBUG) {
                    console.log(`Empty group (${i}), setting default:`, defaults[i])
                }
                agent.memory.actions[i] = _.cloneDeep(defaults[i])
            } else if (agent.memory.actions[i].length >= Agent.SAFE_ACTIONS_INTERATIONS) {
                console.log(`WARN: to much actions (${agent.memory.actions[i].length}), reseting...`)
                agent.memory.actions[i] = _.cloneDeep(defaults[i])
            }
        }

        // for each group of actions
        for (let i = 0; i < agent.memory.actions.length; i++) {
            let group = agent.memory.actions[i]

            if (_.isString(group)) {
                if (Agent.DEBUG) {
                    console.log(`String group found (${i}), changing to array:`, group)
                }
                group = agent.memory.actions[i] = [group]
            }

            // make sure we don't get a infinty loop
            const MAX_ITERATIONS = Math.min(group.length * 2, Agent.SAFE_ACTIONS_INTERATIONS)

            let times = 0
            let actions: string[]
            let result
            let action: IAction

            if (Agent.DEBUG) {
                console.log('running group:', i)
            }

            // for each action in the group
            while (group.length && times++ < MAX_ITERATIONS && Game.cpu.getUsed() < getCpuLimit()) {
                action = ActionsRegistry.fetch(group[0])

                // check if actions exists
                if (action == null) {
                    console.log('action missing', group[0])
                    break
                }

                // run the action
                const actionsResult = action.run(agent)

                // inside the actions, we can return an Array or a String
                if (_.isArray(actionsResult)) {
                    result = actionsResult[0]
                    actions = actionsResult.slice(1)
                } else {
                    result = actionsResult
                    actions = []
                }

                if (Agent.DEBUG) {
                    console.log(`\t`, agent.name, action.name, result, JSON.stringify(actions))
                }

                // delete this action and continue with the next
                if (result === Agent.SHIFT_AND_CONTINUE) {
                    group.shift()
                    continue

                // delete this action and continue with the next group
                } else if (result === Agent.SHIFT_AND_STOP) {
                    group.shift()
                    break

                // continue with the next group
                } else if (result === Agent.WAIT_NEXT_TICK) {
                    break

                // unshift more actions and continue with the first action
                } else if (result === Agent.UNSHIFT_AND_CONTINUE) {
                    group.unshift(...actions)
                    continue

                // unshift more action and continue with the next group
                } else if (result === Agent.UNSHIFT_AND_STOP) {
                    group.unshift(...actions)
                    break

                // delete this action, unshift more actions and continue with the first action
                } else if (result === Agent.SHIFT_UNSHIFT_AND_CONTINUE) {
                    group.shift()
                    group.unshift(...actions)
                    continue

                // delete this action, unshift more actions and continue with the next group
                } else if (result === Agent.SHIFT_UNSHIFT_AND_STOP) {
                    group.shift()
                    group.unshift(...actions)
                    break

                // continue with the next group
                } else {
                    break
                }
            }
        }
    }
}
