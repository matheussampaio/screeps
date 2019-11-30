import * as _ from 'lodash'

import { ActionsRegistry, Process } from '../../core'
import { ICityContext, IPlanSource } from './interfaces'
import { City } from './city'
import { CreepFlee, CreepCheckStop, CreepRemoteHarvester, CreepRemoteHauler, CreepRemoteReserver, CreepRemoteHaulerMaintainRoad, CreepGuard } from '../creep'
import { CreateBody, CREEP_PRIORITY } from '../../utils'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityRemoteMiners extends City {
  run(context: ICityContext, process: Process) {
    this.context = context
    this.process = process

    if (this.queue.length) {
      return this.waitNextTick()
    }

    if (this.storage == null) {
      return this.waitNextTick()
    }

    if (this.storage.store.getUsedCapacity(RESOURCE_ENERGY) <= 5000) {
      return this.waitNextTick()
    }

    if (this.context.remotes == null) {
      return this.unshiftAndContinue(CityRemoteMinersScout.name)
    }

    this.createCreeps()

    return this.sleep(10)
  }

  private createCreeps() {
    let createdSomething = false

    if (Game.creeps[this.context.guard] == null && !this.isCreepNameInQueue(this.context.guard) && Memory.enemies && Object.values(Memory.enemies).length) {
      const attackPowers = Object.values(Memory.enemies).map(item => item.attackPower)
      const maximumAttackPower: number = Math.max(...attackPowers)
      const attackParts = maximumAttackPower / ATTACK_POWER
      const extraAttackParts = Math.min(2, attackParts * 1.2)

      this.context.guard = this.createGuardCreep(this.process.PID, { [ATTACK]: Math.ceil(attackParts + extraAttackParts) })
    }

    for (const roomName in this.context.remotes) {
      const remote = this.context.remotes[roomName]
      const sourcePlans = Object.values(remote.sources) as IPlanSource[]

      for (const sourcePlan of sourcePlans) {
        sourcePlan.harvesters = sourcePlan.harvesters.filter((creepName: string) => Game.creeps[creepName] != null)
        sourcePlan.haulers = sourcePlan.haulers.filter((creepName: string) => Game.creeps[creepName] != null)

        const source = Game.getObjectById(sourcePlan.id) as Source
        const maximumSourceEnergy = source ? source.energyCapacity : SOURCE_ENERGY_NEUTRAL_CAPACITY
        const optimumWorkParts = Math.ceil(maximumSourceEnergy / ENERGY_REGEN_TIME / HARVEST_POWER + 1)

        sourcePlan.desiredWorkParts = Math.min(optimumWorkParts, this.getMaxWorkPartAllowedByEnergyCapacity() * sourcePlan.emptySpaces)

        const currentWorkParts: number = Math.min(sourcePlan.desiredWorkParts, utils.getActiveBodyPartsFromName(sourcePlan.harvesters, WORK))
        const currentCarryParts: number = utils.getActiveBodyPartsFromName(sourcePlan.haulers, CARRY)

        // While the Hauler is traveling from source to storage and back, the
        // Harvester should produce: WORK_PARTS * HARVEST_POWER * DISTANCE * 2
        // Our Haulers should have enough CARRY parts to carry all that energy.
        const energyProduced = sourcePlan.distance * currentWorkParts * HARVEST_POWER * 2

        sourcePlan.desiredCarryParts = energyProduced / CARRY_CAPACITY

        // only create haulers if we don't have links
        if (currentCarryParts < sourcePlan.desiredCarryParts) {
          const memory = { source: sourcePlan.id, containerPos: sourcePlan.containerPos, remoteRoom: sourcePlan.roomName }
          const creepName = this.createHaulers(memory, { [CARRY]: sourcePlan.desiredCarryParts + 2 })

          sourcePlan.haulers.push(creepName)

          createdSomething = true
        }

        if (sourcePlan.harvesters.length < sourcePlan.emptySpaces && currentWorkParts < sourcePlan.desiredWorkParts) {
          const memory: any = {
            source: sourcePlan.id,
            remoteRoom: sourcePlan.roomName,
            containerPos: sourcePlan.containerPos,
            cityPID: this.process.PID
          }

          const creepName = this.createHarvester(memory, { [WORK]: sourcePlan.desiredWorkParts })

          sourcePlan.harvesters.push(creepName)

          createdSomething = true
        }
      }

      if (Game.creeps[remote.reserver] == null && !this.isCreepNameInQueue(remote.reserver)) {
        remote.reserver = this.createReserverCreep(roomName)

        createdSomething = true
      }

      if (createdSomething) {
        break
      }
    }
  }

  private createHaulers(memory: any, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('hauler-remote')

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyCapacityAvailable, maxParts })
      .add([WORK])
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepFlee.name], [CreepRemoteHaulerMaintainRoad.name], [CreepRemoteHauler.name]],
      priority: CREEP_PRIORITY.REMOTE_HAULER
    })

    return creepName
  }

  private createHarvester(memory: any, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('harvester-remote')

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyCapacityAvailable, ticksToMove: 3, maxParts })
      .add([CARRY])
      .add([WORK], { repeat: true })
      .addMoveIfPossible()
      .value(),
      actions: [[CreepCheckStop.name], [CreepFlee.name], [CreepRemoteHarvester.name]],
      priority: CREEP_PRIORITY.REMOTE_HARVESTER
    })

    return creepName
  }

  private createReserverCreep(roomName: string) {
    const creepName = utils.getUniqueCreepName('reserver')

    const body = new CreateBody({ minimumEnergy: this.room.energyCapacityAvailable, maxParts: { [CLAIM]: 2 } })
      .add([CLAIM], { repeat: true })
      .addMoveIfPossible()
      .value()

    this.queue.push({
      memory: {
        remoteRoom: roomName
      },
      creepName,
      body,
      actions: [[CreepCheckStop.name], [CreepFlee.name], [CreepRemoteReserver.name]],
      priority: CREEP_PRIORITY.REMOTE_RESERVER
    })

   return creepName
  }

  private createGuardCreep(pid: number, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('guard')

    const body = new CreateBody({ minimumEnergy: this.room.energyCapacityAvailable, hasRoads: false, ticksToMove: 1, maxParts })
      .add([TOUGH, TOUGH, TOUGH, TOUGH, ATTACK, ATTACK])
      .add([ATTACK], { repeat: true })
      .value()

    this.queue.push({
      memory: {
        roomsToGuard: Object.keys(this.context.remotes),
        energy: this.room.energyCapacityAvailable,
        cityPID: pid
      },
      creepName,
      body,
      actions: [[CreepCheckStop.name], [CreepGuard.name]],
      priority: CREEP_PRIORITY.REMOTE_GUARD
    })

   return creepName
  }
}

@ActionsRegistry.register
export class CityRemoteMinersScout extends CityRemoteMiners {
  run(context: ICityContext) {
    this.context = context

    if (this.context.scoutRooms == null) {
      this.context.scoutRooms = Object.values(Game.map.describeExits(this.room.name))
    }

    if (!this.context.scoutRooms.length) {
      delete this.context.scoutRooms
      delete this.context.scoutCreep

      return this.shiftAndStop()
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

    const roomName = this.context.scoutRooms[0]

    const pos = new RoomPosition(25, 25, roomName)

    if (creep.pos.getRangeTo(pos) > 23) {
      creep.travelTo(pos)
      return this.waitNextTick()
    }

    const sources = creep.room.find(FIND_SOURCES)

    for (const source of sources) {
      const result = PathFinder.search(this.center, { pos: source.pos, range: 1 })

      if (result.incomplete) {
        continue
      }

      const lastPos = result.path[result.path.length - 1] as RoomPosition

      if (this.context.remotes == null) {
        this.context.remotes = {}
      }

      if (this.context.remotes[roomName] == null) {
        this.context.remotes[roomName] = {
          reserver: '',
          sources: {}
        }
      }

      this.context.remotes[roomName].sources[source.id as string] = {
        id: source.id,
        roomName: source.room.name,
        harvesters: [],
        haulers: [],
        containerPos: lastPos,
        distance: result.path.length,
        emptySpaces: 1,
        desiredWorkParts: 0,
        desiredCarryParts: 0
      }
    }

    creep.suicide()

    this.context.scoutRooms.shift()

    return this.waitNextTick()
  }

  private createScoutCreep() {
    const creepName = utils.getUniqueCreepName('scout')

    this.queue.push({
      memory: {},
      creepName,
      body: [MOVE],
      actions: [[CreepCheckStop.name]],
      priority: CREEP_PRIORITY.REMOTE_SCOUT
    })

    this.context.scoutCreep = creepName
  }
}
