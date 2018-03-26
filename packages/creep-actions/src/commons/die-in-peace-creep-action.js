import { Action, ActionRegistry, CreepRoleRegistry, CreepRole } from '@sae/core'
// import { ReplacerCreepRole } from '@sae/creep-roles'

import { ReplaceCreepAction } from './replace-creep-action'

@ActionRegistry.register
export class DieInPeaceCreepAction extends Action {
    run(creep) {
        // if (creep.memory.substitute) {
        //     return this.waitNextTick()
        // }

        // const room = creep.memory.room ? Game.rooms[creep.memory.room] : creep.room

        // const isRoomQueueEmpty = _.get(room, 'memory.queue.length', 0) === 0
        // const isCreepAlmostDying = creep.ticksToLive < creep.body.length * CREEP_SPAWN_TIME + 25

        // if (isRoomQueueEmpty && isCreepAlmostDying) {
        //     creep.memory.substitute = true

        //     const targetRole = CreepRoleRegistry.fetch(creep.memory.role)
        //     const targetBody = targetRole.body(room.energyAvailable)

        //     CreepRoleRegistry.fetch(ReplacerCreepRole.name).queue(room, {
        //         name: `${creep.memory.role}_${Game.time}`,
        //         body: targetBody,
        //         memory: {
        //             subTarget: creep.id
        //         }
        //     })
        // }

        return this.shiftAndStop()
    }
}
