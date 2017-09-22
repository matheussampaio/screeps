import { Agent } from '../../agent'
import { IAction } from '../../interfaces'

export const RoomDefenses: IAction = {
    name: 'room-defenses',
    run(room: Room) {
        const towers: StructureTower[] = room.find(FIND_STRUCTURES, {
            filter: (s: StructureTower) => s.structureType === STRUCTURE_TOWER && s.energy >= 10
        })

        for (const tower of towers) {
            const enemy: Creep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS)

            if (enemy != null) {
                tower.attack(enemy)
            }
        }

        return Agent.WAIT_NEXT_TICK
    }
}
