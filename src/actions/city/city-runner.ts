import * as _ from 'lodash'

import { ActionsRegistry, PRIORITY } from '../../core'
import { City } from './city'
import { CreepCheckStop, CreepHarvester, CreepSingleHauler  } from '../creep'
import { CreateBody } from '../../utils/create-body'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'
import { CreepSingleUpgrader } from '../creep/creep-single-upgrader'
import { CreepSingleBuilder } from '../creep/creep-single-builder'
import { CreepStorager } from '../creep/creep-storager'

@ActionsRegistry.register
export class CityRunner extends City {
  run(context: ICityContext) {
    this.context = context

    console.log(
      `L=${this.controller.level}`,
      `P=${(this.controller.progress / this.controller.progressTotal * 100).toFixed(2)}%`,
      `E=${this.room.energyAvailable}`,
      `Q=${this.queue.length}`,
      `B=${this.builders.length}`,
      `U=${this.upgraders.length}`,
      `H=${this.sources.reduce((sum, source) => source.harvesters.length + sum, 0)}`,
      `C=${this.sources.reduce((sum, source) => source.haulers.length + sum, 0)}`,
      `S=${(this.storage as StructureStorage).store.getUsedCapacity(RESOURCE_ENERGY)}`,
      `CS=${this.room.find(FIND_MY_CONSTRUCTION_SITES).length}`
    )


    if (this.queue.length) {
      return this.waitNextTick()
    }

    const extensionConstructed = this.room.energyCapacityAvailable !== this.planner.energyCapacityAvailable
    const rclChanged = this.planner.rcl !== this.controller.level
    const time = Game.time - (this.planner.time || 0) >= 1000

    if (extensionConstructed || rclChanged || time) {
      this.plan()
    }

    this.planner.storagers = this.storagers.filter((creepName: string) => Game.creeps[creepName] != null)

    if (this.storage && this.storage.isActive() && !this.planner.storagers.length) {
      const creepName = this.createStoragers()

      this.planner.storagers.push(creepName)
    }

    const storageHasLinks = this.findLink(this.planner.storageLinkPos) instanceof StructureLink

    for (const source of this.sources) {
      source.harvesters = source.harvesters.filter((creepName: string) => Game.creeps[creepName] != null)
      source.haulers = source.haulers.filter((creepName: string) => Game.creeps[creepName] != null)

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
      }
    }

    this.planner.upgraders = this.upgraders.filter((creepName: string) => Game.creeps[creepName] != null)

    if (this.planner.upgraders.length === 0) {
      const creepName = this.createUpgrader()

      this.planner.upgraders.push(creepName)

      return this.waitNextTick()
    }

    this.planner.builders = this.builders.filter((creepName: string) => Game.creeps[creepName] != null)

    if (this.planner.builders.length === 0 && this.room.find(FIND_MY_CONSTRUCTION_SITES).length) {
      const creepName = this.createBuilder()

      this.planner.builders.push(creepName)

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

    return this.waitNextTick()
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
      .addMoveIfPossible()
      .value(),
      actions: [[CreepCheckStop.name], [CreepSingleBuilder.name]],
      priority: PRIORITY.LOW
    })

    return creepName
  }

  private createUpgrader(): string {
    const creepName = utils.getUniqueCreepName('upgrader')

    this.queue.push({
      memory: {},
      creepName,
      body: this.upgradersBody,
      actions: [[CreepCheckStop.name], [CreepSingleUpgrader.name]],
      priority: PRIORITY.LOW
    })

    return creepName
  }

  private createStoragers(): string {
    const creepName = utils.getUniqueCreepName('storager')

    this.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyAvailable })
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepStorager.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createHaulers(memory: any, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('hauler')

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: this.room.energyCapacityAvailable, maxParts })
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepSingleHauler.name]],
      priority: PRIORITY.HIGH
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
      .addMoveIfPossible()
      .value(),
      actions: [[CreepCheckStop.name], [CreepHarvester.name]],
      priority: PRIORITY.HIGH
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
}
