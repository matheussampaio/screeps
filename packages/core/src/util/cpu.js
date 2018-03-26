const BUCKET_FLOOR = 2000
const BUCKET_CEILING = 9500
const CPU_BUFFER = 130
const CPU_MINIMUM = 0.5
const CPU_ADJUST = 0.05

let _cpuLimit = 0

export function getCpuLimit() {
    if (Game.rooms.sim) {
        return 10000
    }

    if (Game.cpu.bucket > BUCKET_CEILING) {
        return Game.cpu.tickLimit - CPU_BUFFER
    }

    if (Game.cpu.bucket < BUCKET_FLOOR) {
        return Game.cpu.limit * CPU_MINIMUM
    }

    if (!_cpuLimit) {
        const bucketRange = BUCKET_CEILING - BUCKET_FLOOR
        const adjustedPercentage = (Game.cpu.bucket - (10000 - bucketRange)) / bucketRange
        const cpuPercentage = CPU_MINIMUM + (1 - CPU_MINIMUM) * adjustedPercentage

        _cpuLimit = Game.cpu.limit * (1 - CPU_ADJUST) * cpuPercentage
    }

    return _cpuLimit
}
