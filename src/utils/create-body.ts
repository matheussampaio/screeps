import * as _ from 'lodash'

export class CreateBody {
  private energyAvailable: number
  private currentCreepBody: Partial<Record<BodyPartConstant, any>>
  private maxParts: Partial<Record<BodyPartConstant, any>>
  private ticksToMove: number
  private hasRoads: boolean
  private fatigueGeneratedAfterMoving: number
  private fatigueDecreasedPerTick: number

  constructor({
    minimumEnergy = 150,
    energyAvailable = 0,
    ticksToMove = 1,
    hasRoads = true,
    maxParts = {}
  }: {
    minimumEnergy: number,
    energyAvailable?: number,
    ticksToMove?: number,
    hasRoads?: boolean,
    maxParts?: Partial<Record<BodyPartConstant, any>>
  }) {
    this.energyAvailable = Math.max(minimumEnergy, energyAvailable)
    this.currentCreepBody = {}
    this.ticksToMove = ticksToMove
    this.hasRoads = hasRoads
    this.maxParts = maxParts

    this.fatigueGeneratedAfterMoving = 0
    this.fatigueDecreasedPerTick = 0
  }

  public add(parts: BodyPartConstant[], opts: { repeat?: boolean } = {}): CreateBody {
    let addedSomeParts = 0

    for (const part of parts) {
      const withMove = this.calculateMoveRatio(part) > this.ticksToMove
      const partsToAdd = withMove ? [MOVE, part] : [part]

      if (this.canAddPart(partsToAdd)) {
        this.addParts(partsToAdd)

        addedSomeParts += 1
      }
    }

    if (opts.repeat && addedSomeParts) {
      return this.add(parts, opts)
    }

    return this
  }

  public addMoveIfPossible(): CreateBody {
    const parts = [MOVE]

    while (this.moveRatio > 1 && this.canAddPart(parts)) {
      this.addParts(parts)
    }

    return this
  }

  private calculateMoveRatio(part: BodyPartConstant): number {
    let newFatigueDecreacedPerTick = this.fatigueDecreasedPerTick
    let newFatigueGeneratedAfterMoving = this.fatigueGeneratedAfterMoving

    if (part === MOVE) {
      newFatigueDecreacedPerTick += 2
    } else {
      newFatigueGeneratedAfterMoving += this.hasRoads ? 1 : 2
    }

    if (newFatigueDecreacedPerTick === 0) {
      return Infinity
    }

    return newFatigueGeneratedAfterMoving / newFatigueDecreacedPerTick
  }

  get moveRatio(): number {
    if (this.fatigueDecreasedPerTick === 0) {
      return Infinity
    }

    return this.fatigueGeneratedAfterMoving / this.fatigueDecreasedPerTick
  }

  private addParts(parts: BodyPartConstant[]): void {
    for (const part of parts) {
      this.currentCreepBody[part] = (this.currentCreepBody[part] || 0) + 1
      this.energyAvailable -= BODYPART_COST[part]

      if (part === MOVE) {
        this.fatigueDecreasedPerTick += 2
      } else {
        this.fatigueGeneratedAfterMoving += this.hasRoads ? 1 : 2
      }
    }
  }

  private canAddPart(parts: BodyPartConstant[]): boolean {
    const reachedPartLimit = parts.some(part => 
      this.maxParts[part] && this.currentCreepBody[part] >= this.maxParts[part]
    )

    if (reachedPartLimit) {
      return false
    }

    const partsSumCost: number = _.sum(parts.map(part => BODYPART_COST[part]))

    if (this.energyAvailable < partsSumCost) {
      return false
    }

    const currentCreepSize: number = _.sum(_.values(this.currentCreepBody))

    if (currentCreepSize + parts.length > MAX_CREEP_SIZE) {
      return false
    }

    return true
  }

  public value(): BodyPartConstant[] {
    const body: BodyPartConstant[] = []

    for (const part in this.currentCreepBody) {
      const counter: number = this.currentCreepBody[part as BodyPartConstant]

      for (let i = 0; i < counter; i++) {
        body.push(part as BodyPartConstant)
      }
    }

    // @TODO: sort body to destroy unvaluable parts first (i.e. TOUGH)

    return body
  }

  public human(): string {
    const body = []

    for (const part in this.currentCreepBody) {
      const counter: number = this.currentCreepBody[part as BodyPartConstant]

      body.push(`${part}=${counter}`);
    }

    return body.sort().join() + `  MOVE_RATION=${this.moveRatio}`
  }
}
