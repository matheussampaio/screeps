import { Agent } from '../../agent'
import { IAction } from '../../interfaces'

export const Harvester1: IAction = {
    name: 'harvester-1',
    run(room: Room) {
        // if (room.getCreeps('Harvester').length < 5) {
        //     room.queueCreep({ memory: { role: 'Harvester' }, body: [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE] })
        // }

        return Agent.WAIT_NEXT_TICK
    }
}
