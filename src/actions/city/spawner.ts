import * as _ from 'lodash'

import { Action, ACTIONS_RESULT } from '../../core'
import { ISpawnerItem, ICityContext } from './interfaces'

export class Spawner extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    const room: Room = Game.rooms[context.roomName]

    if (context.queue.length === 0) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    context.queue.sort((i1, i2) => i2.priority - i1.priority)

    const item: ISpawnerItem = context.queue[0]

    if (room.energyAvailable < item.minimumEnergy) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const spawns: StructureSpawn[] | null = room.find(FIND_MY_SPAWNS, {
      filter: (spawn: StructureSpawn) => !spawn.spawning
    })

    const spawn: StructureSpawn | undefined = _.head(spawns)

    if (spawn == null) {
      // calculate for how many ticks the spawn is busy and sleep that amount
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const creepName: string = this.getUniqueName()

    const result: ScreepsReturnCode = spawn.spawnCreep(item.body, creepName)

    if (result !== OK) {
      this.logger.error(`Error spawning creep`, result, room.name)

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
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

    return [ACTIONS_RESULT.WAIT_NEXT_TICK]
  }

  getUniqueName(): string {
    const counters = Memory.counters || (Memory.counters = {})

    if (counters.creepCounter == null) {
      counters.creepCounter = 1
    }

    while (Game.creeps[`creep-${counters.creepCounter}`]) {
      counters.creepCounter++

      if (counters.creepCounter >= Number.MAX_SAFE_INTEGER) {
        counters.creepCounter = 1
      }
    }

    return `creep-${counters.creepCounter}`
  }
}

