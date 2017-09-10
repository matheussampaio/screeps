import { MISSIONS } from '../utils'

export function CreepInstall() {
    Creep.prototype.mMoveTo = function mMoveTo(
            target: RoomObject,
            { next, force }: { next: MISSIONS, force?: boolean }
        ) {
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
}
