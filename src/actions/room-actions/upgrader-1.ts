import { Agent } from '../../agent'
import { IAction } from '../../interfaces'
import { Priority } from '../../enums'
import { CreateBody } from '../../utils'

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
                body: new CreateBody({ minimumEnergy: 250, energy: room.energyAvailable })
                    .add([MOVE, WORK, CARRY, MOVE], { move: 2 })
                    .addWithMove([WORK, CARRY], { work: 13, carry: 12 })
                    .value()
            })
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
