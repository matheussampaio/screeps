import { ReplacerCreepRole } from '../../../creep-roles'
import { ReplaceCreepAction } from './replace-creep-action'
import { Action, ActionRegistry, CreepRoleRegistry, CreepRole } from '../../../engine'

@ActionRegistry.register
export class DieInPeaceCreepAction extends Action {
    run(creep: Creep) {
        if (creep.memory.substitute) {
            return this.waitNextTick()
        }

        const room: Room = creep.memory.room ? Game.rooms[creep.memory.room] : creep.room

        const isRoomQueueEmpty = _.get(room, 'memory.queue.length', 0) === 0
        const isCreepAlmostDying = creep.ticksToLive < creep.body.length * CREEP_SPAWN_TIME + 25

        if (isRoomQueueEmpty && isCreepAlmostDying) {
            creep.memory.substitute = true

            const targetRole: CreepRole = CreepRoleRegistry.fetch(creep.memory.role)
            const targetBody: string = targetRole.body(room.energyAvailable)

            CreepRoleRegistry.fetch(ReplacerCreepRole.name).queue(room, {
                name: `${creep.memory.role}_${Game.time}`,
                body: targetBody,
                memory: {
                    subTarget: creep.id
                }
            })
        }

        return this.waitNextTick()
    }
}
