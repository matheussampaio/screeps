import { Agent } from '../../agent'
import { IAction } from '../../interfaces'
import { Priority } from '../../enums'
import { CreateBody } from '../../utils'
import { Substitute } from '../creep-actions'

export const Builder1: IAction = {
    name: 'builder-1',
    run(room: Room) {
        const MAX_BUILDERS = 3

        let builders = 0

        if (room.creeps.Builder != null) {
            builders = room.creeps.Builder.length
        }

        if (builders < MAX_BUILDERS) {
            room.queueCreep({
                memory: {
                    role: 'Builder'
                },
                priority: Priority.NORMAL,
                body: CreateBody.builder(room.energyAvailable)
            })
        } else if (room.hasFreeEnergy() && Game.time % 10 === 6) {
            const body = CreateBody.builder(room.energyAvailable)
            const oldBuilder: Creep | null = room.canSubstitueForABetterCreep(body, 'Builder')

            if (oldBuilder) {
                room.queueCreep({
                    body,
                    memory: {
                        role: oldBuilder.memory.role,
                        subTarget: oldBuilder.id,
                        actions: [[Substitute.name]]
                    },
                    priority: Priority.NORMAL,
                })
            }
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
