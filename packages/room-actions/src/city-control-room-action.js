import { Action, ActionRegistry, CreepRoleRegistry } from '@sae/core'

@ActionRegistry.register
export class CityControlRoomAction extends Action {
    run(room) {
        if (room.memory.sources == null) {
            room.memory.sources = {}

            room.find(FIND_SOURCES).forEach((source) => {
                room.memory.sources[source.id] = null
            })
        }

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

        // TODO: Idle for some ticks
        return this.waitNextTick()
    }
}
