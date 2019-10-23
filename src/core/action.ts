import { ACTIONS_RESULT, PRIORITY } from './constants'
import { ActionTreeRunner, ForkOptions, Process } from './action-runner'
import { Logger } from './utils/logger'
import { ActionsRegistry } from './actions-registry'

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

  protected halt(): [ACTIONS_RESULT.HALT] {
    return [ACTIONS_RESULT.HALT]
  }

  protected shiftAndContinue(): [ACTIONS_RESULT.SHIFT_AND_CONTINUE] {
    return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
  }

  protected shiftAndStop(): [ACTIONS_RESULT.SHIFT_AND_STOP] {
    return [ACTIONS_RESULT.SHIFT_AND_STOP]
  }

  protected waitNextTick(): [ACTIONS_RESULT.WAIT_NEXT_TICK] {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  protected unshiftAndContinue(...actions: string[]): [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, ...string[]] {
    return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, ...actions]
  }

  protected unshiftAndStop(...actions: string[]): [ACTIONS_RESULT.UNSHIFT_AND_STOP, ...string[]] {
    return [ACTIONS_RESULT.UNSHIFT_AND_STOP, ...actions]
  }

  protected shiftUnshitAndContinue(...actions: string[]): [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE, ...string[]] {
    return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE, ...actions]
  }

  protected shiftUnshitAndStop(...actions: string[]): [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_STOP, ...string[]] {
    return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_STOP, ...actions]
  }

  protected waitNextTickAll(): [ACTIONS_RESULT.WAIT_NEXT_TICK_ALL] {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK_ALL]
  }

  protected retry(): [ACTIONS_RESULT.RETRY] {
   return [ACTIONS_RESULT.RETRY] 
  }
}
