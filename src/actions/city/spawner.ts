import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import { ISpawnerItem, ICityContext } from './interfaces'
import { getUniqueCreepName } from '../../utils'

@ActionsRegistry.register
export class Spawner extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    _.defaults(context, {
      queue: []
    })

    const room: Room = Game.rooms[context.roomName]

    if (context.queue.length === 0) {
      return this.waitNextTick()
    }

    context.queue.sort((i1, i2) => i2.priority - i1.priority)

    const item: ISpawnerItem = context.queue[0]

    const creepCost: number = item.body.reduce((sum, part) => BODYPART_COST[part] + sum, 0)

    if (room.energyAvailable < creepCost) {
      return this.waitNextTick()
    }

    const spawns: StructureSpawn[] | null = room.find(FIND_MY_SPAWNS, {
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
      if (result === ERR_NAME_EXISTS) {
        context.queue.shift()
      }

      this.logger.error(`Error spawning creep`, result, room.name)

      return this.retry()
    }

    context.queue.shift()

    item.memory.creepName = creepName

    const PID: number = this.fork({
      actions: item.actions,
      memory: item.memory,
      name: `Creep-${creepName}`
    })

    const creep: Creep = Game.creeps[creepName]

    creep.memory = {
      PID,
      roomName: room.name
    }

    return this.waitNextTick()
  }
}

