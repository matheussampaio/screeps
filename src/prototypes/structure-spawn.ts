export function StructureSpawnInstall() {
    StructureSpawn.prototype.getCreepCost = function getCreepCost(creep) {
        let sum = 0

        for (let i = 0; i < creep.body.length; i++) {
            const part = creep.body[i]

            sum += BODYPART_COST[part]
        }

        return sum
    }
}
