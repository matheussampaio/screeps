import { Action, ActionRegistry } from "../../../engine"

@ActionRegistry.register
export class RecycleCreepAction extends Action {
    run(creep: Creep) {
        if (creep.memory.spawn == null) {
            const spawn: StructureSpawn = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s: StructureSpawn) => s.structureType === STRUCTURE_SPAWN
            }) as StructureSpawn

            creep.memory.spawn = spawn.id
        }

        const spawn: StructureSpawn = Game.getObjectById(creep.memory.spawn)

        if (spawn == null) {
            delete creep.memory.spawn

            return this.waitNextTick()
        }

        if (creep.pos.isNearTo(spawn)) {
            const result = spawn.recycleCreep(creep)
        } else {
            creep.travelTo(spawn)
        }

        return this.waitNextTick()
    }
}
