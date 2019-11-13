import { ACTIONS_RESULT, PRIORITY } from './constants'
import { ActionTreeRunner, ForkOptions, Process } from './action-runner'
import { Logger } from './utils/logger'

export interface IActionConstructor {
  new(): Action
}

export type ActionResult = [ACTIONS_RESULT, ...string[]] | [ACTIONS_RESULT, string, number, ...string[]]

export class Action {
  static priority: number = PRIORITY.NORMAL

  run(context: object, process: Process): ActionResult {
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

  protected halt(): ActionResult {
    return [ACTIONS_RESULT.HALT]
  }

  protected shiftAndContinue(): ActionResult {
    return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
  }

  protected shiftAndStop(): ActionResult {
    return [ACTIONS_RESULT.SHIFT_AND_STOP]
  }

  protected waitNextTick(): ActionResult {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  protected unshiftAndContinue(...actions: string[]): ActionResult {
    return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, ...actions]
  }

  protected unshiftAndStop(...actions: string[]): ActionResult {
    return [ACTIONS_RESULT.UNSHIFT_AND_STOP, ...actions]
  }

  protected shiftUnshitAndContinue(...actions: string[]): ActionResult {
    return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE, ...actions]
  }

  protected shiftUnshitAndStop(...actions: string[]): ActionResult {
    return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_STOP, ...actions]
  }

  protected waitNextTickAll(): ActionResult {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK_ALL]
  }

  protected retry(): ActionResult {
    return [ACTIONS_RESULT.RETRY]
  }

  protected sleep(ticks: number = 5): ActionResult {
    return [ACTIONS_RESULT.UNSHIFT_AND_STOP, 'Sleep', ticks]
  }
}
