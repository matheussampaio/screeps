import * as _ from 'lodash'

import { Action, Process, ACTIONS_RESULT } from '../core'
import { CreepGeneric } from './creep'
import { CreateBody } from '../utils/create-body'

interface CityContext {
  roomName: string
}

declare global {
  interface CreepMemory {
    roomName: string
    PID: number
  }
}

declare global {
  interface Memory {
    counters?: {
      creepCounter?: number
    }
  }
}

export class City extends Action {
  run(context: CityContext, process: Process): [ACTIONS_RESULT, ...string[]] {
    const room = Game.rooms[context.roomName]

    if (room == null) {
      return [ACTIONS_RESULT.HALT]
    }

    if (room.memory.PID !== process.PID) {
      return [ACTIONS_RESULT.HALT]
    }

    const creepNumberInThisRoom = _.filter(Game.creeps, creep => creep.memory.roomName === room.name).length
    const isEmergency = creepNumberInThisRoom === 0
    const minimumEnergy = isEmergency ? SPAWN_ENERGY_CAPACITY : room.energyCapacityAvailable
    const MAX_CREEP_PER_ROOM = 10

    if (creepNumberInThisRoom >= MAX_CREEP_PER_ROOM) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    if (room.energyAvailable < minimumEnergy) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const spawns: StructureSpawn[] | null = room.find(FIND_MY_SPAWNS, {
      filter: (spawn: StructureSpawn) => !spawn.spawning
    })

    const isEverySpawnerBusy = spawns.length === 0

    if (isEverySpawnerBusy) {
      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const spawn: StructureSpawn = spawns[0]

    const creepName: string = this.getUniqueName()

    const body = new CreateBody({ minimumEnergy, energyAvailable: room.energyAvailable })
      .add([WORK, CARRY], { repeat: true, withMove: true })

    const result: ScreepsReturnCode = spawn.spawnCreep(body.value(), creepName)

    if (result !== OK) {
      this.logger.error(`Error spawning creep`, result, room.name)

      return [ACTIONS_RESULT.WAIT_NEXT_TICK]
    }

    const PID = this.fork({
      actions: [[CreepGeneric.name]],
      memory: { creepName }
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
