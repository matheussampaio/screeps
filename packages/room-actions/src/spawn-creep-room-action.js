import { Action, ActionRegistry, CreepRoleRegistry } from '@sae/core'

@ActionRegistry.register
export class SpawnCreepRoomAction extends Action {
    run(room) {
        // TODO: Create emergency code
        //
        // if (Game.time % 10 === 0) {
        //     const emergency = room.creeps.Haulers == null ||
        //         room.creeps.Haulers.filter(c => !c.request).length === 0 ||
        //         room.creeps.HarvesterEnergy == null ||
        //         room.creeps.HarvesterEnergy.filter(c => !c.request).length === 0

        //     if (emergency) {
        //         room.queue = room.queue.filter((request) => {
        //             request.energyNeeded <= 300
        //         })
        //     }
        // }

        if (room.queue.length === 0) {
            return this.waitNextTick()
        }

        const request = room.queue[0]

        // not enough energy
        if (request.energyNeeded > room.energyAvailable) {
            return this.waitNextTick()
        }

        const spawn = room.spawns.find((s) => !s.spawning)

        // spaw is busy :(
        if (spawn == null) {
            return this.waitNextTick()
        }

        // TODO: Move uncompress to Utils
        const body = Creep.uncompressBody(request.body)
        const name = request.name || `${request.memory.role}_${Game.time}`
        const memory = Object.assign({ room: room.name }, request.memory)

        const result = spawn.spawnCreep(body, name, { memory })

        if (result === OK) {
            room.queue.shift()
        }

        return this.waitNextTick()
    }
}
