import { Agent } from '../../agent'
import { IAction } from '../../interfaces'

const THOUSAND = 1000
const MILLION = THOUSAND * THOUSAND

export const RoomDefenses: IAction = {
    name: 'room-defenses',
    run(room: Room) {
        const towers: StructureTower[] = room.find(FIND_STRUCTURES, {
            filter: (s: StructureTower) => s.structureType === STRUCTURE_TOWER && s.energy >= 10
        })

        const ramparts: Structure[] = room.find(FIND_MY_STRUCTURES, {
            filter: (s: StructureRampart) => {
                return s.structureType === STRUCTURE_RAMPART && s.hits < MILLION * 0.2
            }
        })

        ramparts.sort((a: StructureRampart, b: StructureRampart) => a.hits - b.hits)

        const roads: Structure[] = room.find(FIND_STRUCTURES, {
            filter: (s: StructureRoad) => {
                return s.structureType === STRUCTURE_ROAD && s.hitsMax - s.hits >= 800
            }
        })

        roads.sort((a: StructureRoad, b: StructureRoad) => a.hits - b.hits)

        for (const tower of towers) {
            const enemy: Creep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS)

            if (enemy != null) {
                tower.attack(enemy)
            } else if (ramparts.length) {
                tower.repair(ramparts[0])
            } else if (roads.length) {
                tower.repair(roads.shift())
            }
        }

        return Agent.WAIT_NEXT_TICK
    }
}
