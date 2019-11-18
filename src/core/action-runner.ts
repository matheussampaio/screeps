import * as _ from 'lodash'
import { getCPULimit } from './utils'
import { ACTIONS_RESULT, PRIORITY, PROCESS_STATE } from './constants'
import { ActionsRegistry } from './actions-registry'
import { Action } from './action'
import { Logger } from './utils/logger'
import { Analytics } from './utils/analytics'

export interface Process {
  PID: number
  actions: (string | number)[][]
  memory: object
  name?: string
  priority: number
  state: PROCESS_STATE
}

export interface ForkOptions {
  PID?: number
  actions: string[][]
  memory?: object
  priority?: number
  name?: string
}

declare global {
  interface Memory {
    counter: number
    processes: Process[]
  }
}

export class ActionTreeRunner {
  private static readonly MAX_ITERATIONS: number = 30
  private static queue: Process[] = []
  public static logger: Logger = new Logger()

  public static tick(bootActions: string[][]) {
    if (ActionTreeRunner.shouldReset()) {
      return ActionTreeRunner.reset()
    }

    Analytics.reset()

    ActionTreeRunner.load()

    ActionTreeRunner.boot(bootActions)

    ActionTreeRunner.run()

    ActionTreeRunner.save()

    Analytics.record()
  }

  private static shouldReset(): boolean {
    return Game.flags['reset'] != null
  }

  private static reset(): void {
    for (const creepName in Game.creeps) {
      Game.creeps[creepName].suicide()
    }

    for (const flagName in Game.flags) {
      Game.flags[flagName].remove()
    }

    for (const spawnName in Game.spawns) {
      const spawning = Game.spawns[spawnName].spawning

      if (spawning != null) {
        spawning.cancel()
      }
    }

    for (const key in Memory) {
      delete (Memory as any)[key]
    }
  }

  private static run() {
    ActionTreeRunner.logger.debug('ActionTreeRunner::run::start')

    while (ActionTreeRunner.queue.length) {
      const process: Process | undefined = ActionTreeRunner.queue.shift()

      if (process) {
        ActionTreeRunner.execute(process)
      }
    }

    ActionTreeRunner.logger.debug('ActionTreeRunner::run::end')
  }

  public static fork(options: ForkOptions): number {
    const process: Process = {
      PID: options.PID != null ? options.PID : ActionTreeRunner.getFreePID(),
      priority: options.priority || PRIORITY.NORMAL,
      memory: options.memory || {},
      name: options.name || options.actions[0][0],
      actions: options.actions,
      state: PROCESS_STATE.WAITING
    }

    Memory.processes[process.PID] = process

    ActionTreeRunner.queue.push(process)

    return process.PID
  }

  private static load() {
    ActionTreeRunner.logger.debug('ActionTreeRunner::load::start')

    // Load queue from memory
    ActionTreeRunner.queue = _.values(Memory.processes).filter(p => p != null)

    // Sort processes by priority
    ActionTreeRunner.queue.sort((a, b) => a.priority - b.priority)

    ActionTreeRunner.logger.debug('ActionTreeRunner::load::end')
  }

  private static save() {
    ActionTreeRunner.logger.debug('ActionTreeRunner::save::start')

    for (const PID in Memory.processes) {
      const process: Process | null = Memory.processes[PID]

      if (process == null) {
        delete Memory.processes[PID]
      }

      if (process.state === PROCESS_STATE.DEAD) {
        delete Memory.processes[PID]
      }
    }

    ActionTreeRunner.logger.debug('ActionTreeRunner::save::end')
  }

  private static boot(bootActions: string[][]) {
    _.defaults(Memory, {
      processes: {},
      counter: 1
    })

    ActionTreeRunner.logger.debug('ActionTreeRunner::boot::start')

    const bootProcessExists = Memory.processes[0] != null

    if (!bootProcessExists) {
      ActionTreeRunner.fork({
        PID: 0,
        priority: PRIORITY.HIGH,
        actions: bootActions,
        name: 'Boot'
      })
    } else {
      _.defaultsDeep(Memory.processes[0].actions, bootActions)
    }

    ActionTreeRunner.logger.debug('ActionTreeRunner::boot::end')
  }

  public static getProcessByPID(PID: number): Process {
    return Memory.processes[PID]
  }

  private static getFreePID(): number {
    while (this.getProcessByPID(Memory.counter)) {
      Memory.counter++

      if (Memory.counter >= Number.MAX_SAFE_INTEGER) {
        Memory.counter = 1
      }
    }

    return Memory.counter
  }

  private static execute(process: Process): void {
    process.state = PROCESS_STATE.RUNNING

    for (let subtree of process.actions) {
      let iterations = 0

      while (subtree.length && iterations++ < ActionTreeRunner.MAX_ITERATIONS && Game.cpu.getUsed() < getCPULimit()) {
        ActionTreeRunner.logger.debug('ActionTreeRunner::execute::action::', subtree[0])

        if (subtree[0] === 'Sleep') {
          if (subtree.length === 1 || typeof subtree[1] !== 'number') {
            subtree.shift()
            continue
          }

          if (subtree[1]) {
            subtree[1] -= 1
            break
          }

          subtree.shift() // shift tick counter
          subtree.shift() // shift Sleep action

          continue
        }

        const action: Action = ActionsRegistry.fetch(subtree[0] as string)

        if (action == null) {
          ActionTreeRunner.logger.error('Action not found', subtree[0])

          break
        }

        try {
          const usedCPUBefore = Game.cpu.getUsed()

          const [result, ...actions] = action.run(process.memory, process)

          const usedCPU = Game.cpu.getUsed() - usedCPUBefore

          Analytics.registerActionUsedCPU(subtree[0] as string, usedCPU)

          // delete this action and continue with the next
          if (result === ACTIONS_RESULT.SHIFT_AND_CONTINUE) {
            subtree.shift()
            continue

          // delete this action and continue with the next subtree
          } else if (result === ACTIONS_RESULT.SHIFT_AND_STOP) {
            subtree.shift()
            break

          // continue with the next subtree
          } else if (result === ACTIONS_RESULT.WAIT_NEXT_TICK) {
            break

          // unshift more actions and continue with the first action
          } else if (result === ACTIONS_RESULT.UNSHIFT_AND_CONTINUE) {
            subtree.unshift(...actions)
            continue

          // unshift more action and continue with the next subtree
          } else if (result === ACTIONS_RESULT.UNSHIFT_AND_STOP) {
            subtree.unshift(...actions)
            break

          // delete this action, unshift more actions and continue with the first action
          } else if (result === ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE) {
            subtree.shift()
            subtree.unshift(...actions)
            continue

          // delete this action, unshift more actions and continue with the next subtree
          } else if (result === ACTIONS_RESULT.SHIFT_UNSHIFT_AND_STOP) {
            subtree.shift()
            subtree.unshift(...actions)
            break

          // stop process and mark as dead (it will be cleaned by the OS)
          } else if (result === ACTIONS_RESULT.HALT) {
            process.state = PROCESS_STATE.DEAD
            return

          // stop process
          } else if (result === ACTIONS_RESULT.WAIT_NEXT_TICK_ALL) {
            return

          // re-execute action
          } else if (result === ACTIONS_RESULT.RETRY) {
            continue

          } else {
            throw new Error(`Unknown action result: ${result}`)
          }

        } catch (error) {
          this.logger.error(`${subtree[0]}: ${error.message}`, error.stack)
        }
      }
    }

    process.state = PROCESS_STATE.WAITING
  }
}
