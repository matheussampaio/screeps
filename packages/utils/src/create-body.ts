import _ from 'lodash'

interface IMaximumParts {
  [part: string]: number
}

export class CreateBody {
  private energy: number
  private size: number
  private body: any
  private static readonly MAX_CREEP_SIZE = 50

  constructor({ minimumEnergy, energy }: { minimumEnergy: number; energy: number }) {
    this.energy = Math.max(minimumEnergy, energy)
    this.size = 0
    this.body = {}

    BODYPARTS_ALL.forEach(part => {
      this.body[part] = 0
    })
  }

  public add(parts: BodyPartConstant | BodyPartConstant[], maximum: IMaximumParts = {}): this {
    if (_.isString(parts)) {
      parts = [parts]
    }

    let i = 0

    const minimumCost = _.min(parts.map(part => this.getPartCost(part)))

    while (this.canAddMoreParts(parts, maximum, minimumCost)) {
      i += 1

      const part = parts[i % parts.length]

      if (this.energy >= this.getPartCost(part) && this.body[part] < (maximum[part] || 1)) {
        this.body[part] += 1
        this.size += 1
        this.energy -= this.getPartCost(part)
      }
    }

    return this
  }

  public addWithMove(parts: BodyPartConstant | BodyPartConstant[], maximum: IMaximumParts = {}): this {
    if (_.isString(parts)) {
      parts = [parts]
    }

    let i = 0

    const minimumCost = _.min(parts.map(part => this.getPartCost(part) + BODYPART_COST[MOVE]))

    while (this.canAddMoreParts(parts, maximum, minimumCost, 1)) {
      i += 1
      const part = parts[i % parts.length]

      const energyNeeded = this.getPartCost(part) + BODYPART_COST[MOVE]

      if (this.canAddThisPart(part, energyNeeded, maximum)) {
        this.body[part] += 1
        this.body[MOVE] += 1
        this.size += 2
        this.energy -= energyNeeded
      }
    }

    return this
  }

  private getPartCost(part: BodyPartConstant): number {
    return BODYPART_COST[part]
  }

  private canAddThisPart(part: BodyPartConstant, energyNeeded: number, maximum: IMaximumParts): boolean {
    const hasEnoughEnergy = this.energy >= energyNeeded
    const limitForThisPartReached = this.body[part] >= (maximum[part] || 1)

    return hasEnoughEnergy && !limitForThisPartReached
  }

  private canAddMoreParts(
    parts: BodyPartConstant[],
    maximum: IMaximumParts,
    minimumCost: number = 0,
    movesPart: number = 0
  ): boolean {
    return (
      this.size + movesPart < CreateBody.MAX_CREEP_SIZE &&
      this.energy >= minimumCost &&
      parts.some(part => this.body[part] < (maximum[part] || 1))
    )
  }

  public value(): string {
    return _.keys(this.body)
      .map(part => _.repeat(part[0], this.body[part]))
      .join('')
  }
}
