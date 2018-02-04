import { CreateBody, Priority } from '../util'


export class CreepRole {
    defaults(): string[][] {
        return []
    }

    priority(amount: number): Priority {
        return Priority.NORMAL
    }

    body(energy: number): string {
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

    queue(room: Room, { name, body, memory = {}, priority }: { name?: string, body?: string, memory?: any, priority?: Priority } = {}) {
        // TODO: Move basic prototypes to engine project
        const simillarCreepsAlive = _.get(room, ['creeps', this.role(), 'length'], 0)

        return room.queueCreep({
            name,
            body: body || this.body(room.energyAvailable),
            memory: Object.assign(this.memory(), memory),
            priority: priority || this.priority(simillarCreepsAlive),
        })
    }
}
