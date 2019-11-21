import * as _ from 'lodash'

import { ActionsRegistry, ActionResult } from '../../core'
import { City } from './city'
import { CreepCheckStop, CreepHarvester, CreepSingleBuilder, CreepSingleHauler, CreepSingleUpgrader, CreepStorager, CreepRenew } from '../creep'
import { CreateBody, CREEP_PRIORITY } from '../../utils'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityRunner extends City {
  run(context: ICityContext) {
    this.context = context

    // console.log(`S=${this.storage ? (this.storage.store.getUsedCapacity() / this.storage.store.getCapacity() * 100).toFixed(2) : 'XX'}% - C=${(this.controller.progress / this.controller.progressTotal * 100).toFixed(2)}% level=${this.controller.level} creeps=${_.size(Game.creeps)} queue=${this.queue.length}`)

    return this.replanIfNecessary() ||
      this.maintainStoragers() ||
      this.maintainHarvestersAndHaulers() ||
      this.maintainUpgraders() ||
      this.maintainBuilders() ||
      this.optimizeUpgraders() ||
      this.waitNextTick()
  }

  private calculateEficiency({ distance, work, move, carry }: { distance: number, work: number, move: number, carry: number }): number {
    if (!move || !carry || !work) {
      return 0
    }

    const ticksToArriveAtController = (distance - 3) * Math.ceil(work / move)
    const ticksGettingEnergy = 1500 / (Math.floor(carry * 50 / work) + 1)

    return (1500 - ticksToArriveAtController - ticksGettingEnergy) * work
  }

  private addPermutation(perms: { [key: string]: number }, body: BodyPartConstant[], distance: number): boolean {
    const work = body.filter(p => p === WORK).length
    const move = body.filter(p => p === MOVE).length
    const carry = body.filter(p => p === CARRY).length

    const index = body.sort().join()

    if (perms[index] != null) {
      return false
    }

    perms[index] = this.calculateEficiency({
      distance,
      work,
      move,
      carry
    })

    return true
  }

  private generatePermutations(energy: number, distance: number) {
    const parts: BodyPartConstant[] = [MOVE, CARRY, WORK]
    const perms: { [key: string]: number } = {}

    const queue: { energy: number, body: BodyPartConstant[] }[] = [{
      energy: energy - (BODYPART_COST[MOVE] + BODYPART_COST[CARRY] + BODYPART_COST[WORK]),
      body: [MOVE, CARRY, WORK]
    }]

    while (queue.length) {
      const item = queue.shift()

      if (item == null) {
        continue
      }

      this.addPermutation(perms, item.body, distance)

      if (item.body.length >= MAX_CREEP_SIZE) {
        continue
      }

      for (const part of parts) {
        const cost = BODYPART_COST[part]

        if (cost <= item.energy) {
          const body = [...item.body, part]

          if (this.addPermutation(perms, body, distance)) {
            queue.push({ energy: item.energy - cost, body })
          }
        }
      }
    }

    return perms
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
      body: this.controller.level === 8 ? [MOVE, CARRY, WORK] : this.upgradersBody,
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

  private plan(): void {
    this.planner.energyCapacityAvailable = this.room.energyCapacityAvailable
    this.planner.rcl = this.controller.level
    this.planner.time = Game.time

    // best upgraders body
    const goal = this.room.find(FIND_MY_SPAWNS).map(source => source.pos)
    const distance = PathFinder.search(this.controller.pos, goal).path.length
    const permutations = this.generatePermutations(this.room.energyCapacityAvailable, distance / 3)

    let bestEntry: string = ''
    let bestEficiency = 0

    for (const key in permutations) {
      const eficiency = permutations[key]

      if (eficiency > bestEficiency) {
        bestEficiency = eficiency
        bestEntry = key
      }
    }

    this.upgradersBody = bestEntry.split(',') as BodyPartConstant[]

    const positions = [
      this.planner.storageLinkPos,
      ...this.sources.sort((a, b) => b.distance - a.distance).map(s => s.linkPos)
    ]

    // build sources
    for (let i = 0; i < CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.controller.level]; i++) {
      if (!positions.length) {
        break
      }

      const hasPos = positions.shift() as { x: number, y: number }

      const link = this.findLink(hasPos)

      if (link == null) {
        const pos = this.room.getPositionAt(hasPos.x, hasPos.y) as RoomPosition

        this.room.createConstructionSite(pos, STRUCTURE_LINK)

        break
      }
    }
  }

  private findLink(hasPos: { x: number, y: number } | undefined | null): StructureLink | ConstructionSite | null {
    if (hasPos == null) {
      return null
    }

    const pos = this.room.getPositionAt(hasPos.x, hasPos.y) as RoomPosition

    const structure = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_LINK) as StructureLink

    if (structure) {
      return structure
    }

    const constructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(c => c.structureType === STRUCTURE_LINK)

    if (constructionSite) {
      return constructionSite
    }

    return null
  }

  private maintainUpgraders(): ActionResult | null {
    if (this.isSpawningCreep(this.planner.upgraders)) {
      return this.waitNextTick()
    }

    this.planner.upgraders = this.upgraders.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

    if (this.planner.upgraders.length === 0) {
      const creepName = this.createUpgrader()

      this.planner.upgraders.push(creepName)

      return this.waitNextTick()
    }

    return null
  }

  private maintainStoragers(): ActionResult | null {
    if (this.storage == null || !this.storage.isActive()) {
      return null
    }

    if (this.isSpawningCreep(this.planner.storagers)) {
      return this.waitNextTick()
    }

    this.planner.storagers = this.storagers.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

    if (!this.planner.storagers.length) {
      const creepName = this.createStoragers(this.room.energyAvailable)

      this.planner.storagers.push(creepName)

      return this.waitNextTick()
    }

    if (this.planner.storagers.length === 1) {
      const storager = Game.creeps[this.planner.storagers[0]]

      if (storager == null || storager.spawning) {
        return null
      }

      const currentBody = storager.body.map(p => p.type)
      const desiredBody = this.getStoragersBody(this.room.energyCapacityAvailable)

      if (!utils.isBodyEqual(currentBody, desiredBody)) {
        const creepName = this.createStoragers(this.room.energyCapacityAvailable, storager.ticksToLive)

        this.planner.storagers.push(creepName)

        return this.waitNextTick()
      }

      const ticksToSpawnCreep = desiredBody.length * CREEP_SPAWN_TIME
      const ticksToFillExtensions = this.room.energyCapacityAvailable / EXTENSION_ENERGY_CAPACITY[this.controller.level]

      if (storager.ticksToLive as number <= ticksToSpawnCreep + ticksToFillExtensions) {
        const creepName = this.createStoragers(this.room.energyCapacityAvailable, storager.ticksToLive)

        this.planner.storagers.push(creepName)

        return this.waitNextTick()
      }
    }

    return null
  }

  private replanIfNecessary(): null {
    const extensionConstructed = this.room.energyCapacityAvailable !== this.planner.energyCapacityAvailable
    const rclChanged = this.planner.rcl !== this.controller.level
    const time = Game.time - (this.planner.time || 0) >= 1000

    if (extensionConstructed || rclChanged || time) {
      this.plan()
    }

    return null
  }

  private maintainBuilders(): ActionResult | null {
    if (this.isSpawningCreep(this.planner.builders)) {
      return this.waitNextTick()
    }

    this.planner.builders = this.builders.filter((creepName: string) => Game.creeps[creepName] != null || this.isCreepNameInQueue(creepName))

    if (this.planner.builders.length === 0 && this.room.find(FIND_MY_CONSTRUCTION_SITES).length) {
      const creepName = this.createBuilder()

      this.planner.builders.push(creepName)

      return this.waitNextTick()
    }

    return null
  }

  private optimizeUpgraders() {
    if (this.isSpawningCreep(this.planner.upgraders)) {
      return this.waitNextTick()
    }

    const energyProduced = Object.values(this.sources).reduce((sum: number, source: any) => {
      const currentWorkParts = utils.getActiveBodyPartsFromName(source.harvesters, WORK)

      return sum + (currentWorkParts * HARVEST_POWER * 1500)
    }, 0)

    const creepsConsumingEnergy = this.planner.upgraders.concat(this.planner.builders)
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

      this.planner.upgraders.push(creepName)

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

      const currentWorkParts: number = Math.min(this.OPTIMUM_WORK_PARTS_PER_SOURCE, utils.getActiveBodyPartsFromName(source.harvesters, WORK))
      const currentCarryParts: number = utils.getActiveBodyPartsFromName(source.haulers, CARRY)

      // While the Hauler is traveling from source to storage and back, the
      // Harvester should produce: WORK_PARTS * HARVEST_POWER * DISTANCE * 2
      // Our Haulers should have enough CARRY parts to carry all that energy.
      const energyProduced = source.distance * currentWorkParts * HARVEST_POWER * 2

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

      if (harvesterDieing && !harvesterDieing.memory.replacementOnTheWay) {
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
