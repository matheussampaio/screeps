import * as _ from 'lodash'

import { ActionsRegistry, ActionResult } from '../../core'
import { City } from './city'
import { CreepCheckStop, CreepRepair, CreepHarvester, CreepSingleBuilder, CreepSingleHauler, CreepSingleUpgrader, CreepStorager, CreepRenew, CreepMiniBuilder } from '../creep'
import { CreateBody, CREEP_PRIORITY } from '../../utils'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityRunner extends City {
  run(context: ICityContext) {
    this.context = context

    return this.maintainStoragers() ||
      this.maintainHarvestersAndHaulers() ||
      this.maintainUpgraders() ||
      this.maintainBuilders() ||
      this.maintainRepairs() ||
      this.optimizeUpgraders() ||
      this.waitNextTick()
  }

  private createMiniBuilder(): string {
    const creepName = utils.getUniqueCreepName('mini-builder')

    this.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: 250 })
      .add([CARRY, WORK])
      .value(),
      actions: [[CreepCheckStop.name], [CreepMiniBuilder.name]],
      priority: CREEP_PRIORITY.BUILDER
    })

    return creepName
  }

  private createRepair(): string {
    const creepName = utils.getUniqueCreepName('repair')

    this.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: this.room.energyCapacityAvailable, ticksToMove: 1 })
      .add([CARRY, WORK], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepRepair.name]],
      priority: CREEP_PRIORITY.BUILDER
    })

    return creepName
  }

  private createBuilder(): string {
    const creepName = utils.getUniqueCreepName('builder')

    this.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: this.room.energyCapacityAvailable, ticksToMove: 2 })
      .add([CARRY, WORK], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepSingleBuilder.name]],
      priority: CREEP_PRIORITY.BUILDER
    })

    return creepName
  }

  private createUpgrader(): string {
    const creepName = utils.getUniqueCreepName('upgrader')

    this.queue.push({
      memory: {
        energy: this.room.energyCapacityAvailable
      },
      creepName,
      body: this.controller.level === 8 ? [MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK] : this.upgradersBody,
      actions: [[CreepCheckStop.name], [CreepSingleUpgrader.name], [CreepRenew.name]],
      priority: CREEP_PRIORITY.UPGRADER
    })

    return creepName
  }

  private createStoragers(energyAvailable: number, ticksToFulfill?: number): string {
    const creepName = utils.getUniqueCreepName('storager')

    this.queue.push({
      memory: {
        energy: energyAvailable
      },
      creepName,
      ticksToFulfill,
      body: this.getStoragersBody(energyAvailable),
      actions: [[CreepCheckStop.name], [CreepStorager.name], [CreepRenew.name]],
      priority: CREEP_PRIORITY.STORAGER,
    })

    return creepName
  }

  private getStoragersBody(energyAvailable: number): BodyPartConstant[] {
    return new CreateBody({ minimumEnergy: 300, energyAvailable })
      .add([CARRY], { repeat: true })
      .value()
  }

  private createHaulers(memory: any, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('hauler')

    memory.energy = this.room.energyCapacityAvailable

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyCapacityAvailable, maxParts })
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepSingleHauler.name], [CreepRenew.name]],
      priority: CREEP_PRIORITY.HAULER
    })

    return creepName
  }

  private createHarvester(memory: any, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('harvester')

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyCapacityAvailable, ticksToMove: 3, maxParts })
      .add([CARRY, WORK, WORK, WORK, WORK, WORK, WORK])
      .value(),
      actions: [[CreepCheckStop.name], [CreepHarvester.name]],
      priority: CREEP_PRIORITY.HARVESTER
    })

    return creepName
  }

  private maintainUpgraders(): ActionResult | null {
    if (this.upgraders == null) {
      this.upgraders = []
    }

    if (this.isSpawningCreep(this.upgraders)) {
      return this.waitNextTick()
    }

    this.upgraders = this.upgraders.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

    if (this.upgraders.length === 0) {
      const creepName = this.createUpgrader()

      this.upgraders.push(creepName)

      return this.waitNextTick()
    }

    return null
  }

  private maintainStoragers(): ActionResult | null {
    if (this.storage == null || !this.storage.isActive()) {
      return null
    }

    if (this.isSpawningCreep(this.storagers)) {
      return this.waitNextTick()
    }

    this.storagers = this.storagers.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

    if (this.storagers.length < 2) {
      const creepName = this.createStoragers(this.room.energyAvailable)

      this.storagers.push(creepName)

      return this.waitNextTick()
    }

    if (this.storagers.length === 2) {
      for (let i = 0; i < this.storagers.length; i++) {
        const storager = Game.creeps[this.storagers[i]]

        if (storager == null || storager.spawning) {
          return null
        }

        const currentBody = storager.body.map(p => p.type)
        const desiredBody = this.getStoragersBody(this.room.energyCapacityAvailable)

        if (!utils.isBodyEqual(currentBody, desiredBody)) {
          const creepName = this.createStoragers(this.room.energyCapacityAvailable, storager.ticksToLive)

          this.storagers.push(creepName)

          return this.waitNextTick()
        }

        const ticksToSpawnCreep = desiredBody.length * CREEP_SPAWN_TIME
        const ticksToFillExtensions = this.room.energyCapacityAvailable / EXTENSION_ENERGY_CAPACITY[this.controller.level]

        if (storager.ticksToLive as number <= ticksToSpawnCreep + ticksToFillExtensions) {
          const creepName = this.createStoragers(this.room.energyCapacityAvailable, storager.ticksToLive)

          this.storagers.push(creepName)

          return this.waitNextTick()
        }
      }
    }

    return null
  }

  private maintainRepairs(): ActionResult | null {
    const towers = this.room.find(FIND_MY_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_TOWER
    })

    if (towers.length || this.isSpawningCreep(this.repairs)) {
      return this.waitNextTick()
    }

    this.repairs = this.repairs.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

    if (this.repairs.length) {
      return null
    }

    const repairStructures = this.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hits < s.hitsMax
    })

    if (repairStructures.length) {
      const creepName = this.createRepair()

      this.repairs.push(creepName)

      return this.waitNextTick()
    }

    return null
  }

  private maintainBuilders(): ActionResult | null {
    if (this.isSpawningCreep(this.builders)) {
      return this.waitNextTick()
    }

    this.builders = this.builders.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

    const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES)

    if (this.builders.length === 0 && constructionSites.find(c => c.structureType === STRUCTURE_WALL || c.structureType === STRUCTURE_RAMPART)) {
      const creepName = this.createMiniBuilder()

      this.builders.push(creepName)

      return this.waitNextTick()
    }

    if (this.builders.length < 3 && constructionSites.find(c => c.structureType !== STRUCTURE_WALL && c.structureType !== STRUCTURE_RAMPART)) {
      const creepName = this.createBuilder()

      this.builders.push(creepName)

      return this.waitNextTick()
    }

    return null
  }

  private optimizeUpgraders() {
    if (this.isSpawningCreep(this.upgraders)) {
      return this.waitNextTick()
    }

    const energyProduced = Object.values(this.sources).reduce((sum: number, source: any) => {
      const currentWorkParts = utils.getActiveBodyPartsFromName(source.harvesters, WORK)

      return sum + (currentWorkParts * HARVEST_POWER * 1500)
    }, 0)

    const creepsConsumingEnergy = this.upgraders.concat(this.builders)
    const energyConsumed = creepsConsumingEnergy.reduce((sum: number, creepName: string) => {
      const currentWorkParts = utils.getActiveBodyPartsFromName(creepName, WORK)

      return sum + (currentWorkParts * HARVEST_POWER * 1500)
    }, 0)
    const energyConsumedByWalls = 0

    const creepsInRoom: Creep[] = _.filter(Game.creeps, creep => creep.memory.roomName === this.room.name)
    const totalCreepsCost = utils.getCreepsCost(creepsInRoom)

    const total = energyProduced - energyConsumedByWalls - energyConsumed - totalCreepsCost

    const workParts = this.upgradersBody.filter((part: string) => part === WORK).length
    const consumeByUpgrader = workParts * HARVEST_POWER * 1500 + (_.sum(this.upgradersBody.map((p: BodyPartConstant) => BODYPART_COST[p])))

    if (total >= consumeByUpgrader) {
      const creepName = this.createUpgrader()

      this.upgraders.push(creepName)

      return this.waitNextTick()
    }

    return null
  }

  private maintainHarvestersAndHaulers(): ActionResult | null {
    const storageHasLinks = this.findLink(this.planner.storageLinkPos) instanceof StructureLink

    for (const source of this.sources) {
      source.harvesters = source.harvesters.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))
      source.haulers = source.haulers.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

      if (this.isSpawningCreep(source.harvesters) || this.isSpawningCreep(source.haulers)) {
        continue
      }

      const currentWorkParts: number = utils.getActiveBodyPartsFromName(source.harvesters, WORK)
      const currentCarryParts: number = utils.getActiveBodyPartsFromName(source.haulers, CARRY)

      // While the Hauler is traveling from source to storage and back, the
      // Harvester should produce: WORK_PARTS * HARVEST_POWER * DISTANCE * 2
      // Our Haulers should have enough CARRY parts to carry all that energy.
      const energyProduced = source.distance * Math.min(this.OPTIMUM_WORK_PARTS_PER_SOURCE, currentWorkParts) * HARVEST_POWER * 2

      source.desiredCarryParts = energyProduced / CARRY_CAPACITY

      const link = this.findLink(source.linkPos)
      const sourceHasLinks = link instanceof StructureLink
      const isHaulerNeeded = !storageHasLinks || !sourceHasLinks

      // only create haulers if we don't have links
      if (isHaulerNeeded && currentCarryParts * CARRY_CAPACITY < energyProduced) {
        const memory = { source: source.id, containerPos: source.containerPos }
        const creepName = this.createHaulers(memory, { [CARRY]: source.desiredCarryParts + 2 })

        source.haulers.push(creepName)

        return this.waitNextTick()
      }

      if (source.harvesters.length < source.emptySpaces && currentWorkParts < source.desiredWorkParts) {
        const memory: any = { source: source.id }

        if (link) {
          memory.linkPos = source.linkPos
        } else {
          memory.containerPos = source.containerPos
        }

        const creepName = this.createHarvester(memory, { [WORK]: source.desiredWorkParts })

        source.harvesters.push(creepName)

        return this.waitNextTick()
      }

      const harvesterDieing = source.harvesters.map((creepName: string) => Game.creeps[creepName])
        .filter((creep: Creep | undefined) => creep)
        .find((creep: Creep) => creep.ticksToLive as number <= creep.body.length * CREEP_SPAWN_TIME + source.distance)

      if (harvesterDieing && !harvesterDieing.memory.replacementOnTheWay && currentWorkParts <= source.desiredWorkParts) {
        harvesterDieing.memory.replacementOnTheWay = true

        const memory: any = { source: source.id }

        if (link) {
          memory.linkPos = source.linkPos
        } else {
          memory.containerPos = source.containerPos
        }

        const creepName = this.createHarvester(memory, { [WORK]: source.desiredWorkParts })

        source.harvesters.push(creepName)

        return this.waitNextTick()
      }
    }

    return null
  }
}
