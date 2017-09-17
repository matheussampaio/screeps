import { Agent } from '../../agent'
import { IAction } from '../../interfaces'

export const CreateCreep: IAction = {
    name: 'create-creep',
    run(room: Room) {
        while (room.getQueue().length && _.isString(room.getQueue()[0].body[0])) {
            console.log('remove invalid request')
            room.getQueue().shift()
        }

        if (room.getQueue().length === 0) {
            console.log('empty queue')
            return Agent.SHIFT_AND_CONTINUE
        }

        const request = room.getQueue()[0]

        console.log('s', request.body[0], room.energyAvailable)

        if (request.body[0] <= room.energyAvailable) {
            console.log('a')
            const spawns: StructureSpawn[] = room.getFreeSpawns()

            if (spawns.length) {
                console.log('b')
                const spawn: StructureSpawn = spawns[0]

                const memory = Object.assign({ role: request.role, room: room.name }, request.memory)
                const name = request.name || `${request.role}_${Game.time}`

                const body: string[] = _.map(request.body[1], (p) => {
                    switch (p) {
                        case 'w':
                            return WORK
                        case 'm':
                            return MOVE
                        case 'c':
                            return CARRY
                        default:
                            return MOVE
                    }
                })

                let result = spawn.createCreep(body, name, memory)

                if (result === ERR_NAME_EXISTS) {
                    result = spawn.createCreep(body, undefined, memory)
                }

                if (_.isString(result)) {
                    console.log('c')
                    room.__spawns.shift()
                    room.getQueue().shift()
                }

                console.log(result)
            }
        }

        return Agent.WAIT_NEXT_TICK
    }
}
