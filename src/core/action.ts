import { ACTIONS_RESULT, PRIORITY } from './constants'
import { ActionTreeRunner, ForkOptions, Process } from './action-runner'
import { Logger } from './utils/logger'

export interface IActionConstructor {
  new(): Action
}

export class Action {
  static priority: number = PRIORITY.NORMAL

  run(context: object, process: Process): [ACTIONS_RESULT, ...string[]] {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  public fork(options: ForkOptions): number {
    return ActionTreeRunner.fork(options)
  }

  public get logger(): Logger {
    return ActionTreeRunner.logger
  }

  public getProcessByPID(PID: number): Process {
    return ActionTreeRunner.getProcessByPID(PID)
  }
}
