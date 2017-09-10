export function StructureSpawnInstall() {
    StructureSpawn.prototype.getCreepCost = function getCreepCost(body: string[]) {
        let sum = 0

        for (const part of body) {
            sum += BODYPART_COST[part]
        }

        return sum
    }
}
