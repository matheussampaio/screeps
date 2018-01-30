import { Agent } from '../../agent'
import { IAction } from '../../interfaces'
import { CreepRoles } from '../../roles'
import { getBody } from '../../utils'
import { CreateCreep } from './create-creep'

export const RoomController: IAction = {
    name: 'room-controller',
    run(room: Room) {
        if (room.controller.level >= 5 && Game.time % 20 === 0) {
            _.defaultsDeep(room.memory, {
                links: {
                    sources: {},
                    storage: '',
                    controller: ''
                }
            })

            Object.keys(room.memory.sources).forEach(source => {
                if (room.memory.links.sources[source] == null) {
                    const links = Game.getObjectById(source).pos.findInRange(FIND_MY_STRUCTURES, 2, {
                        filter: s => s.structureType === STRUCTURE_LINK
                    })

                    if (links.length) {
                        room.memory.links.sources[source] = links[0].id
                    }
                }
            })

            if (room.storage && room.memory.links.storage == null) {
                const links = room.storage.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                    filter: s => s.structureType === STRUCTURE_LINK
                })

                if (links.length) {
                    room.memory.links.storage = links[0].id
                }
            }

            if (room.controller.level >= 7 && room.memory.links.controller == null) {
                const links = room.controller.pos.findInRange(FIND_MY_STRUCTURES, 2, {
                    filter: s => s.structureType === STRUCTURE_LINK
                })

                if (links.length) {
                    room.memory.links.controller = links[0].id
                }
            }
        }


        return Agent.WAIT_NEXT_TICK
    }
}
