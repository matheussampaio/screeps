import { ActionRunner, CreepRoleRegistry, installPrototypes, RoomRoleRegistry } from '@sae/core'
import { HarvesterEnergyCreepRole } from '@sae/creep-roles'
import * as CreepActions from '@sae/creep-actions'
import { CityRoomRole } from '@sae/room-roles'

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
    const room = Game.rooms[roomName]

    if (room.controller && room.controller.my) {
      const roomRoleName = _.get(room, 'memory.role', CityRoomRole.name)
      const role = RoomRoleRegistry.fetch(roomRoleName)

      if (role != null) {
        ActionRunner.run(room, role.defaults())
      }
    }
  }

  for (const creepName in Game.creeps) {
    const creep = Game.creeps[creepName]

    if (creep.spawning) {
      continue
    }

    const role = CreepRoleRegistry.fetch(creep.memory.role)

    if (role != null) {
      ActionRunner.run(creep, role.defaults())
    }
  }
}
