import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ISpawnerItem, ICityContext } from './interfaces'
import { getUniqueCreepName } from '../../utils'
import { City } from './city'

@ActionsRegistry.register
export class CitySpawner extends City {
  run(context: ICityContext) {
    this.context = context

    if (this.queue.length === 0) {
      return this.waitNextTick()
    }

    this.queue.sort((i1, i2) => i2.priority - i1.priority)

    const item: ISpawnerItem = this.queue[0]

    const creepCost: number = item.body.reduce((sum, part) => BODYPART_COST[part] + sum, 0)

    if (this.room.energyAvailable < creepCost) {
      return this.waitNextTick()
    }

    const spawns: StructureSpawn[] | null = this.room.find(FIND_MY_SPAWNS, {
      filter: (spawn: StructureSpawn) => !spawn.spawning
    })

    const spawn: StructureSpawn | undefined = _.head(spawns)

    if (spawn == null) {
      // calculate for how many ticks the spawn is busy and sleep that amount
      return this.waitNextTick()
    }

    const creepName: string = item.creepName || getUniqueCreepName()

    const result: ScreepsReturnCode = spawn.spawnCreep(item.body, creepName)

    if (result !== OK) {
      this.queue.shift()

      this.logger.error(`Error spawning creep`, creepName, result, this.room.name)

      return this.retry()
    }

    this.queue.shift()

    item.memory.creepName = creepName

    const PID: number = this.fork({
      actions: item.actions,
      memory: item.memory,
      name: `Creep-${creepName}`
    })

    const creep: Creep = Game.creeps[creepName]

    creep.memory = {
      PID,
      roomName: this.room.name
    }

    return this.waitNextTick()
  }
}

