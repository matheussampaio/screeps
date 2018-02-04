import '../Traveler/Traveler'
// import * as Actions from './actions'
// import { ActionsRegistry, Agent } from './agent'
// import { IAction, ICreepRole, IRoomRole } from './interfaces'
// import { CreepRoles, RoomRoles } from './roles'
// import { Stats } from './utils'

// _.values(Actions).forEach((action: IAction) => ActionsRegistry.register(action))
import { ActionRunner, CreepRoleRegistry, CreepRole, installPrototypes, RoomRole, RoomRoleRegistry } from './engine'

import { HarvesterEnergyCreepRole } from './creep-roles'
import * as CreepActions from './creep-actions'

import { CityRoomRole } from './room-roles'

installPrototypes()

export function loop() {
    console.log(`#${Game.time}`)

    // GC creeps
    for (const creepName in Memory.creeps) {
        if (Game.creeps[creepName] == null) {
            delete Memory.creeps[creepName]
        }
    }

    for (const roomName in Game.rooms) {
        const room: Room = Game.rooms[roomName]

        if (room.controller && room.controller.my) {
            const roomRoleName = _.get(room, 'memory.role', CityRoomRole.name)
            const role: RoomRole | null = RoomRoleRegistry.fetch(roomRoleName)

            if (role != null) {
                ActionRunner.run(room, role.defaults())
            }
        }
    }

    for (const creepName in Game.creeps) {
        const creep: Creep = Game.creeps[creepName]

        if (creep.spawning) {
            continue
        }

        const role: CreepRole | null = CreepRoleRegistry.fetch(creep.memory.role)

        if (role != null) {
            ActionRunner.run(creep, role.defaults())
        }
    }
}
