declare global {
    interface Room {
        getCreeps(role?: string): any
        getQueue(): any
        queueCreep(creep: any): void
        getFreeSpawns(): StructureSpawn[]

        __creeps: any
        __spawns: StructureSpawn[]
    }
}

export function RoomInstall() {
    Room.prototype.getCreeps = function getCreeps(role: string) {
        // cache this method
        if (this.__creeps != null) {
            if (role != null) {
                return this.__creeps[role] || []
            }

            return this.__creeps
        }

        // group creeps by role
        this.__creeps = _.chain(Game.creeps)
            .filter((creep: Creep) => creep.my && creep.memory.role && creep.memory.room === this.name)
            .tap((array) => {
                this.getQueue()
                    .forEach((req: any) => {
                        array.push(Object.assign({ request: true }, req))
                    })
            })
            .groupBy((creep: Creep) => creep.memory.role)
            .value()

        if (role != null) {
            return this.__creeps[role] || []
        }

        return this.__creeps
    }

    Room.prototype.getQueue = function getQueue() {
        if (this.memory.queue == null) {
            this.memory.queue = []
        }

        return this.memory.queue
    }

    Room.prototype.queueCreep = function queueCreep(creep) {
        this.getQueue().push(creep)

        // init this.__creeps
        const creeps = this.getCreeps()

        // if we didn't have this role before, create it
        if (creeps[creep.memory.role] == null) {
            creeps[creep.memory.role] = []
        }

        // add this creep to the role array
        creeps[creep.memory.role].push(creep)
    }

    Room.prototype.getFreeSpawns = function getFreeSpawns() {
        if (this.__spawns != null) {
            return this.__spawns
        }

        this.__spawns = this.find(FIND_MY_SPAWNS, { filter: (s: StructureSpawn) => !s.spawning })

        return this.__spawns
    }
}
