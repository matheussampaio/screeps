import { Priority } from '../enums'
import { CreepRequest } from '../interfaces'

declare global {
    interface Room {
        queueCreep({ name, body, priority, memory }: { name?: string, body: string, priority: Priority, memory: any }): void

        creeps: any
        spawns: StructureSpawn[]
        queue: CreepRequest[]

        __creeps: any
        __spawns: StructureSpawn[]
    }
}
export function RoomInstall() {
    Object.defineProperty(Room.prototype, 'creeps', {
        get() {
            if (this.__creeps != null) {
                return this.__creeps
            }

            this.__creeps = _.chain(Game.creeps)
                .filter((creep: Creep) => creep.my && creep.memory.role && creep.memory.room === this.name)
                .tap((array) => {
                    this.queue.forEach((req: any) => {
                        array.push(Object.assign({ request: true }, req))
                    })
                })
                .groupBy((creep: Creep) => creep.memory.role)
                .value()

            return this.__creeps
        }
    })

    Object.defineProperty(Room.prototype, 'queue', {
        get: function() {
            if (this.memory.queue == null) {
                this.memory.queue = []
            }

            return this.memory.queue
        },
        set: function(value) {
            this.memory.queue = value
        }
    })

    Object.defineProperty(Room.prototype, 'spawns', {
        get() {
            if (this.__spawns != null) {
                return this.__spawns
            }

            this.__spawns = this.find(FIND_MY_SPAWNS)

            return this.__spawns
        }
    })

    Room.prototype.queueCreep = function queueCreep({ name, body, priority, memory = {} } = {}) {
        const creepRequest = {
            body,
            name,
            memory: Object.assign({ room: this.name }, memory),
            priority: priority || Priority.NORMAL,
            energyNeeded: Creep.energyNeededFromCompressedBody(body)
        }

        if (creepRequest.energyNeeded <= this.energyCapacityAvailable) {
            this.queue.push(creepRequest)

            this.queue.sort((a: CreepRequest, b: CreepRequest) => b.priority - a.priority)

            const role = creepRequest.memory.role

            // if we didn't have this role before, create it
            if (this.creeps[role] == null) {
                this.creeps[role] = []
            }

            // add this creep to the role array
            this.creeps[role].push(Object.assign({ request: true }, creepRequest))
        }
    }
}
