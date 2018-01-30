import { Agent } from '../../agent'
import { CreepRequest, IAction } from '../../interfaces'

export const CreateCreep: IAction = {
    name: 'create-creep',
    run(room: Room) {
        if (Game.time % 10 === 0) {
            const emergency = room.creeps.Haulers == null ||
                room.creeps.Haulers.filter(c => !c.request).length === 0 ||
                room.creeps.HarvesterEnergy == null ||
                room.creeps.HarvesterEnergy.filter(c => !c.request).length === 0

            if (emergency) {
                room.queue = room.queue.filter((request: CreepRequest) => {
                    request.energyNeeded <= 300
                })
            }
        }

        if (room.queue.length === 0) {
            return Agent.SHIFT_AND_CONTINUE
        }

        const request: CreepRequest = room.queue[0]

        if (request.energyNeeded <= room.energyAvailable) {
            const spawn = room.spawns.find((s: StructureSpawn) => !s.spawning)

            if (spawn) {
                const body: string[] = Creep.uncompressBody(request.body)
                const name = request.name || `${request.memory.role}_${Game.time}`
                const memory = Object.assign({ room: room.name }, request.memory)

                const result = spawn.spawnCreep(body, name, { memory })

                if (result === OK) {
                    room.queue.shift()
                }
            }
        }

        return Agent.WAIT_NEXT_TICK
    }
}
