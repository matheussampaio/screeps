import { Action, ActionRegistry, CreepRoleRegistry } from "../../engine"
import { HarvesterEnergyCreepRole, HaulerEnergyCreepRole } from "../../creep-roles"

@ActionRegistry.register
export class ControlTowerRoomAction extends Action {
    run(room: Room) {
        const towers: StructureTower[] = room.find(FIND_STRUCTURES, {
            filter: (t: StructureTower) => t.structureType === STRUCTURE_TOWER && t.my && t.energy >= 10
        }) as StructureTower[]

        if (towers.length === 0) {
            // TODO: If we don't have towers, go idle for some ticks.
            // room.memory.idle = 10
            // return this.shiftUnshiftAndStop(Idle.name)
            return this.waitNextTick()
        }

        const rampartHP: { [k: number]: number } = {
            1: 250,
            2: 500,
            3: 750,
            4: 1000,
            5: 5000,
            6: 25000,
            7: 75000,
            8: 200000
        }

        const ramparts: Structure[] = room.find(FIND_MY_STRUCTURES, {
            filter: (r: StructureRampart) => {
                return r.structureType === STRUCTURE_RAMPART && r.hits < rampartHP[room.controller.level]
            }
        })

        ramparts.sort((r1: StructureRampart, r2: StructureRampart) => r1.hits - r2.hits)

        const roads: Structure[] = room.find(FIND_STRUCTURES, {
            filter: (r: StructureRoad) => {
                return r.structureType === STRUCTURE_ROAD && r.hitsMax - r.hits >= 800
            }
        })

        roads.sort((r1: StructureRoad, r2: StructureRoad) => r1.hits - r2.hits)

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

        return this.waitNextTick()
    }
}
