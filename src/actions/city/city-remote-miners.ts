import * as _ from 'lodash'

import { ActionsRegistry, PRIORITY } from '../../core'
import { ICityContext } from './interfaces'
import { City } from './city'
import { CreepCheckStop } from '../creep'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityRemoteMiners extends City {
  run(context: ICityContext) {
    this.context = context

    for (const roomName in this.remotes) {
      const remote = this.remotes[roomName]

      if (remote.sources == null) {
        this.context.scoutRoom = roomName
        return this.unshiftAndContinue(CityRemoteMinersScout.name)
      }
    }

    return this.waitNextTick()
  }

  protected get remotes() {
    if (this.context.remotes == null) {
      this.context.remotes = {} as any

      const exits = Game.map.describeExits(this.room.name)

      for (const roomName of Object.values(exits)) {
        if (roomName == null) {
          continue
        }

        this.context.remotes[roomName] = {
          remoteRoomName: roomName,
          pid: -1
        } as any
      }
    }

    return this.context.remotes
  }
}

@ActionsRegistry.register
export class CityRemoteMinersScout extends CityRemoteMiners {
  run(context: ICityContext) {
    this.context = context

    if (this.context.scoutRoom == null) {
      return this.shiftAndContinue()
    }

    const creep = Game.creeps[this.context.scoutCreep]

    if (creep == null) {
      if (!this.isCreepNameInQueue(this.context.scoutCreep)) {
        this.createScoutCreep()
      }

      return this.waitNextTick()
    }

    if (creep.spawning) {
      return this.waitNextTick()
    }

    const pos = new RoomPosition(25, 25, this.context.scoutRoom)

    if (creep.pos.getRangeTo(pos) > 23) {
      creep.travelTo(pos)
      return this.waitNextTick()
    }

    const sources = creep.room.find(FIND_SOURCES)

    this.remotes[this.context.scoutRoom].sources = {} as any

    for (const source of sources) {
      const result = PathFinder.search(this.center, { pos: source.pos, range: 1 })

      if (result.incomplete) {
        continue
      }

      const lastPos = result.path[result.path.length - 1] as RoomPosition

      _.defaultsDeep(this.remotes[this.context.scoutRoom], {
        sources: {
          [source.id as string]: {
            id: source.id,
            harvesters: [],
            haulers: [],
            containerPos: lastPos,
            distance: result.path.length,
            emptySpaces: 1,
            desiredWorkParts: 0,
            desiredCarryParts: 0
          }
        }
      })
    }

    creep.suicide()

    return this.shiftAndStop()
  }

  private createScoutCreep() {
    const creepName = utils.getUniqueCreepName('scout')

    this.queue.push({
      memory: {},
      creepName,
      body: [MOVE],
      actions: [[CreepCheckStop.name]],
      priority: PRIORITY.VERY_LOW
    })

    this.context.scoutCreep = creepName
  }
}
