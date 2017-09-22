const BUCKET_FLOOR = 2000
const BUCKET_CEILING = 9500
const CPU_BUFFER = 130
const CPU_MINIMUM = 0.50
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
        const cpuPercentage = CPU_MINIMUM + ((1 - CPU_MINIMUM) * adjustedPercentage)

        _cpuLimit = (Game.cpu.limit * (1 - CPU_ADJUST)) * cpuPercentage
    }

    return _cpuLimit
}

export function getBody(room) {
    let energy = 0

    if (room.energyAvailable < 200) {
        return [200, 'MWMC']
    }

    const parts = [
        ['M', 50],
        ['W', 100],
        ['C', 50]
    ]

    let i = 0
    let body = ''

    while (room.energyAvailable - energy >= 50) {
        const part = parts[i % parts.length]

        if (part[1] <= room.energyAvailable - energy) {
            body += part[0]
            energy += part[1]
        }

        i++
    }

    return [energy, body]
}
