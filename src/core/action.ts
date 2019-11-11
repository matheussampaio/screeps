import { ACTIONS_RESULT, PRIORITY } from './constants'
import { ActionTreeRunner, ForkOptions, Process } from './action-runner'
import { Logger } from './utils/logger'
import { ActionsRegistry } from './actions-registry'

export interface IActionConstructor {
  new(): Action
}

export class Action {
  static priority: number = PRIORITY.NORMAL

  run(context: object, process: Process): [ACTIONS_RESULT, ...(string | number)[]] {
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

  protected halt(): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.HALT]
  }

  protected shiftAndContinue(): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.SHIFT_AND_CONTINUE]
  }

  protected shiftAndStop(): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.SHIFT_AND_STOP]
  }

  protected waitNextTick(): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  protected unshiftAndContinue(...actions: string[]): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.UNSHIFT_AND_CONTINUE, ...actions]
  }

  protected unshiftAndStop(...actions: string[]): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.UNSHIFT_AND_STOP, ...actions]
  }

  protected shiftUnshitAndContinue(...actions: string[]): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_CONTINUE, ...actions]
  }

  protected shiftUnshitAndStop(...actions: string[]): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.SHIFT_UNSHIFT_AND_STOP, ...actions]
  }

  protected waitNextTickAll(): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.WAIT_NEXT_TICK_ALL]
  }

  protected retry(): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.RETRY]
  }

  protected sleep(ticks: number = 5): [ACTIONS_RESULT, ...(string | number)[]] {
    return [ACTIONS_RESULT.UNSHIFT_AND_STOP, 'Sleep', ticks]
  }
}

@ActionsRegistry.register
export class Sleep extends Action {
  run(context: any) {
    if (context.wakeAt == null && context.sleepFor == null) {

      return this.shiftAndStop()
    }

    if (context.wakeAt == null) {
      context.wakeAt = Game.time + context.sleepFor
      delete context.sleepFor
    }

    if (Game.time >= context.wakeAt) {
      delete context.wakeAt

      return this.shiftAndStop()
    }

    return this.waitNextTick()
  }
}
