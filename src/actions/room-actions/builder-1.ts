import { Agent } from '../../agent'
import { IAction } from '../../interfaces'
import { Priority } from '../../enums'
import { CreateBody } from '../../utils'

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
                priority: builders === 0 ? Priority.HIGH : Priority.NORMAL,
                body: new CreateBody({ minimumEnergy: 250, energy: room.energyAvailable })
                    .add([MOVE, WORK, CARRY, MOVE], { move: 2 })
                    .addWithMove([WORK, CARRY], { work: 13, carry: 12 })
                    .value()
            })
        }

        return Agent.SHIFT_AND_CONTINUE
    }
}
