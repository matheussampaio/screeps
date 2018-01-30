import { IAction } from '../interfaces'
import { getCpuLimit, Stats } from '../utils'
import { ActionsRegistry } from './actions-registry'

export class Agent {
    public static readonly SHIFT_AND_CONTINUE = 'SHIFT_AND_CONTINUE'
    public static readonly SHIFT_AND_STOP = 'SHIFT_AND_STOP'
    public static readonly WAIT_NEXT_TICK = 'WAIT_NEXT_TICK'
    public static readonly UNSHIFT_AND_CONTINUE = 'UNSHIFT_AND_CONTINUE'
    public static readonly UNSHIFT_AND_STOP = 'UNSHIFT_AND_STOP'
    public static readonly SHIFT_UNSHIFT_AND_CONTINUE = 'SHIFT_UNSHIFT_AND_CONTINUE'
    public static readonly SHIFT_UNSHIFT_AND_STOP = 'SHIFT_UNSHIFT_AND_STOP'

    public static readonly SAFE_ACTIONS_INTERATIONS = 10

    public static readonly DEBUG = false

    public static run(agent: any, defaults: string[][]) {
        if (agent.memory.DEBUG) {
            console.log('\nRunning agent:', agent)
            console.log('actions:', agent.memory.actions)
        }

        if (agent.memory.actions == null) {
            agent.memory.actions = _.cloneDeep(defaults)
        }

        for (let i = 0; i < defaults.length; i++) {
            if (agent.memory.actions[i] == null || agent.memory.actions[i].length <= 0) {
                if (agent.memory.DEBUG) {
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
                if (agent.memory.DEBUG) {
                    console.log(`String group found (${i}), changing to array:`, group)
                }
                group = agent.memory.actions[i] = [group]
            }

            // make sure we don't get a infinty loop
            let times = 0
            let actions: string[]
            let result
            let action: IAction

            if (agent.memory.DEBUG) {
                console.log('running group:', i)
            }

            // for each action in the group
            while (group.length) {
                action = ActionsRegistry.fetch(group[0])

                if (times++ >= Agent.SAFE_ACTIONS_INTERATIONS) {
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

                let actionsResult

                const startCPU = Game.cpu.getUsed()

                if (agent.memory.DEBUG) {
                    console.log('running action:', group[0])
                }

                try {
                    actionsResult = action.run(agent)
                } catch (error) {
                    console.log('ERROR:', group[0], error.stack)
                    break
                }

                const spentCPU = Game.cpu.getUsed() - startCPU

                const actionName = group[0]

                if (Stats.times.actions[actionName] == null) {
                    Stats.times.actions[actionName] = { totalCPU: spentCPU, count: 1 }
                } else {
                    Stats.times.actions[actionName].totalCPU += spentCPU
                    Stats.times.actions[actionName].count += 1
                }

                const average = Stats.times.actions[actionName].totalCPU / Stats.times.actions[actionName].count

                Stats.times.actions[actionName].average = average

                // inside the actions, we can return an Array or a String
                if (_.isArray(actionsResult)) {
                    result = actionsResult[0]
                    actions = actionsResult.slice(1)
                } else {
                    result = actionsResult
                    actions = []
                }

                if (agent.memory.DEBUG) {
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
