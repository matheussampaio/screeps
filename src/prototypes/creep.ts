import { MISSIONS } from '../utils'

export function CreepInstall() {
    Creep.prototype.mMoveTo = function mMoveTo(
            target: RoomObject,
            { next, force }: { next: MISSIONS, force?: boolean }
        ) {
        if (target === null) {
            return ERR_INVALID_TARGET
        }

        if (this.memory.path == null || force) {
            this.memory.path = this.pos.findPathTo(target).map((pos) => pos.direction)
        }

        if (this.memory.path.length === 0) {
            delete this.memory.path
            delete this.memory.stuck

            this.memory.mission = next

            return OK
        }

        let result = OK

        if (this.fatigue === 0) {
            const direction = this.memory.path[0]

            result = this.move(direction)

            if (result === OK) {
                this.memory.path.shift()
                this.memory.stuck = 0
            } else {
                this.memory.stuck = this.memory.stuck + 1 || 1
            }
        }

        return result
    }

    Creep.prototype.mMoveToTarget = function mMoveToTarget({ next, force }: { next: MISSIONS, force?: boolean }) {
        if (this.memory.target == null) {
            return ERR_INVALID_TARGET
        }

        const target = Game.getObjectById(this.memory.target)

        if (target == null) {
            delete this.memory.target

            return ERR_INVALID_TARGET
        }

        return this.mMoveTo(target, { next, force })
    }

    Creep.prototype.mGetEnergy = function mGetEnergy({ next }: { next: MISSIONS }) {
        if (this.memory.path == null ) {
            this.memory.path = this.pos.findPathTo(target).map((pos) => pos.direction)
        }

        if (this.fatigue === 0) {
            const direction = this.memory.path[0]

            if (this.move(direction) === OK) {
                this.memory.path.shift()
                this.memory.stuck = 0

                if (this.memory.path.length === 0) {
                    delete this.memory.path
                    delete this.memory.stuck

                    this.memory.mission = next
                }
            } else {
                this.memory.stuck = this.memory.stuck + 1 || 1
            }
        }
    }

    Creep.prototype.mPickupTarget = function mPickupTarget() {
        if (this.memory.target == null) {
            return ERR_INVALID_TARGET
        }

        const target = Game.getObjectById(this.memory.target)

        if (target == null) {
            delete this.memory.target

            return ERR_INVALID_TARGET
        }

        return this.pickup(target)
    }
}
