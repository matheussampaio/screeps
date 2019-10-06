import * as _ from 'lodash'
import { getCPULimit } from './utils'
import { ACTIONS_RESULT, PRIORITY } from './constants'
import { ActionsRegistry } from './actions-registry'
import { Action } from './action'

export interface Process {
  priority: number
  actions: string[][]
  memory: object
  name?: string
}

export interface ForkOptions {
  PID?: number
  priority?: number
  memory?: object
  actions: string[][]
}

declare global {
  interface Memory {
    counter: number
    processes: Process[]
  }
}

export class ActionTreeRunner {
  private static readonly MAX_ITERATIONS = 30
  private static queue = []

  public static tick(bootActions: string[][]) {
    _.defaults(Memory, {
      processes: {},
      counter: 1
    })

    ActionTreeRunner.load()

    ActionTreeRunner.boot(bootActions)

    ActionTreeRunner.run()
  }

  private static run() {
    while (ActionTreeRunner.queue.length) {
      const process = this.queue.shift()

      ActionTreeRunner.execute(process)
    }
  }

  public static fork(options: ForkOptions): number {
    _.defaults(options, {
      PID: this.getFreePID(),
      priority: PRIORITY.NORMAL,
      memory: {},
      name: options.actions[0][0]
    })

    Memory.processes[options.PID] = options as Process

    ActionTreeRunner.queue.push(options)

    return options.PID
  }

  private static load() {
    // Load queue from memory
    ActionTreeRunner.queue = _.values(Memory.processes)

    // Sort processes by priority
    ActionTreeRunner.queue.sort((a, b) => a.priority - b.priority)
  }

  private static boot(bootActions: string[][]) {
    const bootProcessExists = Memory.processes[0] != null

    if (!bootProcessExists) {
      ActionTreeRunner.fork({
        PID: 0,
        priority: PRIORITY.HIGH,
        actions: bootActions
      })
    }
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
    for (let subtree of process.actions) {
      let iterations = 0

      while (subtree.length && iterations++ < ActionTreeRunner.MAX_ITERATIONS && Game.cpu.getUsed() < getCPULimit()) {
        const action: Action = ActionsRegistry.fetch(subtree[0])

        const [result, ...actions] = action.run(process.memory)

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
        }
      }
    }
  }
}
