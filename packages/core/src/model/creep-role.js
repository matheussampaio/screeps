import { CreateBody, Priority } from '../util'

export class CreepRole {
    defaults() {
        return []
    }

    priority(amount) {
        return Priority.NORMAL
    }

    body(energy) {
        return 'mwc'
    }

    role() {
        return this.constructor.name
    }

    memory() {
        return {
            role: this.role()
        }
    }

    queue(room, { name, body, memory = {}, priority } = {}) {
        // TODO: Move basic prototypes to engine project
        const simillarCreepsAlive = _.get(room, ['creeps', this.role(), 'length'], 0)

        return room.queueCreep({
            name,
            body: body || this.body(room.energyAvailable),
            memory: Object.assign(this.memory(), memory),
            priority: priority || this.priority(simillarCreepsAlive)
        })
    }
}
