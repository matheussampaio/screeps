import { Agent } from '../../agent'
import { IAction } from '../../interfaces'
import { Priority } from '../../enums'
import { CreateBody } from '../../utils'
import { Substitute } from '../creep-actions'

export const Upgrader1: IAction = {
    name: 'upgrader-1',
    run(room: Room) {
        let upgraders = 0

        if (room.creeps.Upgrader != null) {
            upgraders = room.creeps.Upgrader.length
        }

        if (upgraders <= 0) {
            room.queueCreep({
                memory: {
                    role: 'Upgrader'
                },
                priority: Priority.NORMAL,
                body: CreateBody.upgrader(room.energyAvailable)
            })
        } else if (room.hasFreeEnergy() && Game.time % 10 === 7) {
            const body = CreateBody.upgrader(room.energyAvailable)
            const oldUpgrader: Creep | null = room.canSubstitueForABetterCreep(body, 'Upgrader')

            if (oldUpgrader) {
                room.queueCreep({
                    body,
                    memory: {
                        role: oldUpgrader.memory.role,
                        subTarget: oldUpgrader.id,
                        actions: [[Substitute.name]]
                    },
                    priority: Priority.NORMAL,
                })
            }
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
