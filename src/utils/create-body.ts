export class CreateBody {
    private energy: number = 0
    private size: number = 0
    private body: any = {}
    static MAX_CREEP_SIZE = 50

    constructor({ minimumEnergy, energy }: { minimumEnergy: number, energy: number }) {
        this.energy = Math.max(minimumEnergy, energy)

        BODYPARTS_ALL.forEach(part => this.body[part] = 0)
    }

    add(parts: string | string[], maximum: any = {}) {
        if (_.isString(parts)) {
            parts = [ parts ]
        }

        let i = 0

        const minimumCost = _.min(parts.map(part => BODYPART_COST[part]))

        while (this.canAddMoreParts(parts, maximum, minimumCost)) {
            const part = parts[i++ % parts.length]

            if (this.energy >= BODYPART_COST[part] && this.body[part] < (maximum[part] || 1)) {
                this.body[part] += 1
                this.size += 1
                this.energy -= BODYPART_COST[part]
            }
        }

        return this
    }

    addWithMove(parts: string | string[], maximum = {}) {
        if (_.isString(parts)) {
            parts = [ parts ]
        }

        let i = 0

        const minimumCost = _.min(parts.map(part => BODYPART_COST[part] + BODYPART_COST[MOVE]))

        while (this.canAddMoreParts(parts, maximum, minimumCost, 1)) {
            const part = parts[i++ % parts.length]

            const energyNeeded = BODYPART_COST[part] + BODYPART_COST[MOVE]

            if (this.canAddThisPart(part, energyNeeded, maximum)) {
                this.body[part] += 1
                this.body[MOVE] += 1
                this.size += 2
                this.energy -= energyNeeded
            }
        }

        return this
    }

    canAddThisPart(part: string, energyNeeded: number, maximum: any) {
        const hasEnoughEnergy = this.energy >= energyNeeded
        const limitForThisPartReached = this.body[part] >= (maximum[part] || 1)

        return hasEnoughEnergy && !limitForThisPartReached
    }

    canAddMoreParts(parts: string[], maximum: any, minimumCost: number, movesPart = 0) {
        return this.size + movesPart < CreateBody.MAX_CREEP_SIZE
            && this.energy >= minimumCost
            && parts.some(part => this.body[part] < (maximum[part] || 1))
    }

    value() {
        return _.keys(this.body)
            .map(part => _.repeat(part[0], this.body[part]))
            .join('')
    }
}
