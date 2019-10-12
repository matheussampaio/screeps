import * as _ from 'lodash'

export class CreateBody {
  private energyAvailable: number
  private currentCreepBody: Partial<Record<BodyPartConstant, any>>

  constructor({ minimumEnergy = 150, energyAvailable }: { minimumEnergy: number, energyAvailable: number }) {
    this.energyAvailable = Math.max(minimumEnergy, energyAvailable)
    this.currentCreepBody = {}
  }

  public add(parts: BodyPartConstant[], opts: { withMove?: boolean, repeat?: boolean } = {}): CreateBody {
    let addedSomeParts = 0

    for (const part of parts) {
      const partsToAdd = opts.withMove ? [MOVE, part] : [part]

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

  private addParts(parts: BodyPartConstant[]): void {
    for (const part of parts) {
      this.currentCreepBody[part] = (this.currentCreepBody[part] || 0) + 1
      this.energyAvailable -= BODYPART_COST[part]
    }
  }

  private canAddPart(parts: BodyPartConstant[]): boolean {
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

  value(): BodyPartConstant[] {
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
}
