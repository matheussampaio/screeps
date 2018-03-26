import { ActionReturn } from '../util'

export class Action {
  run(agent) {
    console.log('Missing run method')

    return this.waitNextTick()
  }

  shiftAndContinue() {
    return [ActionReturn.SHIFT_AND_CONTINUE]
  }

  shiftAndStop() {
    return [ActionReturn.SHIFT_AND_STOP]
  }

  waitNextTick() {
    return [ActionReturn.WAIT_NEXT_TICK]
  }

  unshiftAndContinue(...actionsNames) {
    return [ActionReturn.UNSHIFT_AND_CONTINUE, ...actionsNames]
  }

  unshiftAndStop(...actionsNames) {
    return [ActionReturn.UNSHIFT_AND_STOP, ...actionsNames]
  }

  shiftUnshitAndContinue(...actionsNames) {
    return [ActionReturn.SHIFT_UNSHIFT_AND_CONTINUE, ...actionsNames]
  }

  shiftUnshitAndStop(...actionsNames) {
    return [ActionReturn.SHIFT_UNSHIFT_AND_STOP, ...actionsNames]
  }
}
