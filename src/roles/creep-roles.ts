import { Builder, DieInPeace, HarvesterEnergy, Hauler, Upgrader } from '../actions'
import { ICreepRole } from '../interfaces'
import { getBody } from '../utils'

const roles: { [key: string]: ICreepRole } = {
    HarvesterEnergy: {
        critical: 2,
        defaults: [ [HarvesterEnergy.name], [DieInPeace.name] ],
        level: 1,
        maximum: 2,
        process(room: Room, creeps: Creep[], critical?: boolean) {
            if (room.memory.sources == null) {
                room.memory.sources = {}

                room.find(FIND_SOURCES)
                    .forEach((source: Source) => {
                        room.memory.sources[source.id] = ''
                    })
            }

            let result = null

            if (critical) {
                if (creeps == null || creeps.length < roles.Harvester.critical) {
                    const sourceId = _.keys(room.memory.sources).find((id: string) => {
                        return Game.creeps[room.memory.sources[id]] == null
                    })

                    result = {
                        role: 'Harvester',
                        body: [150, 'WWMM'],
                        memory: {
                            target: sourceId
                        }
                    }
                }
            } else if (creeps != null && creeps.length < roles.Harvester.maximum) {
                const sourceId = _.keys(room.memory.sources).find((id: string) => {
                    return Game.creeps[room.memory.sources[id]] == null
                })

                result = {
                    role: 'Harvester',
                    body: getBody(room),
                    memory: {
                        target: sourceId
                    }
                }
            }

            console.log('result', JSON.stringify(result))

            return result
        }
    },
    Hauler: {
        critical: 1,
        defaults: [[Hauler.name], [DieInPeace.name]],
        level: 1,
        maximum: 2
    },
    Upgrader: {
        critical: 1,
        defaults: [[Upgrader.name], [DieInPeace.name]],
        level: 1,
        maximum: 2
    },
    Builder: {
        critical: 1,
        defaults: [[Builder.name]],
        level: 2,
        maximum: 2
    },
}

export const CreepRoles = {
    get(role: string): ICreepRole | null {
        return roles[role] || null
    },
    [Symbol.iterator]() {
        const keys = _.keys(roles)
        let i = 0

        return {
            next: () => ({ value: keys[i++], done: i > keys.length })
        }
    }
}
