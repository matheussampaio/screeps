import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'

@ActionsRegistry.register
export class CreepHarvesterMineral extends Action {
  private context: any

  run(context: any): [ACTIONS_RESULT, ...string[]] {
    this.context = context

    const mineral: Mineral | null = Game.getObjectById(this.context.mineral)

    if (mineral == null) {
      this.logger.error(`CreepHarvesterMineral:${this.context.creepName}: mineral does not exists`)

      return this.halt()
    }

    if (!this.creep.pos.isNearTo(mineral)) {
      this.creep.travelTo(mineral, { range: 1 })

      return this.waitNextTick()
    }

    const extractor: StructureExtractor | null = Game.getObjectById(this.context.extractor || '50744959231ddd1')

    if (extractor == null) {
      return this.waitNextTick()
    }

    if (!extractor.cooldown && mineral.mineralAmount) {
      const result = this.creep.harvest(mineral)
    }

    return this.waitNextTick()
  }

  private get creep(): Creep {
    return Game.creeps[this.context.creepName]
  }
}

