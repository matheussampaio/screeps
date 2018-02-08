import { ActionReturn } from "../util"

export class Action {
    // get name(): string {
    //     return this.name
    // }

    run(agent: Creep | Room): (ActionReturn | string)[] {
        console.log("Missing run method")

        return this.waitNextTick()
    }

    shiftAndContinue(): (ActionReturn | string)[] {
        return [ActionReturn.SHIFT_AND_CONTINUE]
    }

    shiftAndStop(): (ActionReturn | string)[] {
        return [ActionReturn.SHIFT_AND_STOP]
    }

    waitNextTick(): (ActionReturn | string)[] {
        return [ActionReturn.WAIT_NEXT_TICK]
    }

    unshiftAndContinue(...actionsNames: string[]): (ActionReturn | string)[] {
        return [ActionReturn.UNSHIFT_AND_CONTINUE, ...actionsNames]
    }

    unshiftAndStop(...actionsNames: string[]): (ActionReturn | string)[] {
        return [ActionReturn.UNSHIFT_AND_STOP, ...actionsNames]
    }

    shiftUnshitAndContinue(...actionsNames: string[]): (ActionReturn | string)[] {
        return [ActionReturn.SHIFT_UNSHIFT_AND_CONTINUE, ...actionsNames]
    }

    shiftUnshitAndStop(...actionsNames: string[]): (ActionReturn | string)[] {
        return [ActionReturn.SHIFT_UNSHIFT_AND_STOP, ...actionsNames]
    }
}
