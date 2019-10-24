import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT, PRIORITY } from '../../core'
import { CreepCheckStop, CreepHarvester, CreepSingleHauler  } from '../creep'
import { CreateBody } from '../../utils/create-body'
import { ICityContext } from './interfaces'
import * as utils from '../../utils'
import { CreepSingleUpgrader } from '../creep/creep-single-upgrader'
import { CreepSingleBuilder } from '../creep/creep-single-builder'
import { CreepStorager } from '../creep/creep-storager'

// With 6 WORK parts, a creep can farm 3600 in 300 ticks (6 * 2 * 300).
// It's more than enough to farm a 3k source.
const OPTIMUM_WORK_PARTS_PER_SOURCE = 6

@ActionsRegistry.register
export class City extends Action {
  run(context: ICityContext): [ACTIONS_RESULT, ...string[]] {
    _.defaultsDeep(context, {
      queue: [],
      plan: {
        upgraders: [],
        builders: [],
        storagers: [],
        time: 0
      }
    })

    const room: Room = Game.rooms[context.roomName]

    if (context.queue.length) {
      return this.waitNextTick()
    }

    const controllerUpgraded = room.controller && room.controller.level !== context.plan.rcl
    const extensionConstructed = room.energyCapacityAvailable !== context.plan.energyCapacity
    const enoughTimePass = Game.time - context.plan.time >= 1000

    if (controllerUpgraded || extensionConstructed || enoughTimePass) {
      this.plan(context)
    }

    context.plan.storagers = context.plan.storagers.filter(creepName => Game.creeps[creepName] != null)

    if (room.storage && room.storage.isActive() && !context.plan.storagers.length) {
      const creepName = this.createStoragers(context)

      context.plan.storagers.push(creepName)

      return this.waitNextTick()
    }

    for (const source of context.plan.sources) {
      source.harvesters = source.harvesters.filter(creepName => Game.creeps[creepName] != null)
      source.haulers = source.haulers.filter(creepName => Game.creeps[creepName] != null)

      const currentWorkParts: number = Math.min(OPTIMUM_WORK_PARTS_PER_SOURCE, utils.getActiveBodyPartsFromName(source.harvesters, WORK))
      const currentCarryParts: number = utils.getActiveBodyPartsFromName(source.haulers, CARRY)

      // While the Hauler is traveling from source to storage and back, the
      // Harvester should produce: WORK_PARTS * HARVEST_POWER * DISTANCE * 2
      // Our Haulers should have enough CARRY parts to carry all that energy.
      const energyProduced = source.distance * currentWorkParts * HARVEST_POWER * 2

      source.desiredCarryParts = energyProduced / CARRY_CAPACITY

      if (currentCarryParts * CARRY_CAPACITY < energyProduced) {
        const memory = { source: source.id, containerPos: source.containerPos }
        const creepName = this.createHaulers(context, memory)

        source.haulers.push(creepName)

        return this.waitNextTick()
      }

      if (source.harvesters.length < source.emptySpaces && currentWorkParts < source.desiredWorkParts) {
        const memory = { source: source.id, containerPos: source.containerPos }
        const creepName = this.createHarvester(context, memory)

        source.harvesters.push(creepName)

        return this.waitNextTick()
      }
    }

    context.plan.upgraders = context.plan.upgraders.filter(creepName => Game.creeps[creepName] != null)

    if (context.plan.upgraders.length === 0) {
      const creepName = this.createUpgrader(context)

      context.plan.upgraders.push(creepName)

      return this.waitNextTick()
    }

    context.plan.builders = context.plan.builders.filter(creepName => Game.creeps[creepName] != null)

    if (context.plan.builders.length === 0 && room.find(FIND_MY_CONSTRUCTION_SITES).length) {
      const creepName = this.createBuilder(context)

      context.plan.builders.push(creepName)

      return this.waitNextTick()
    }

    const energyProduced = context.plan.sources.reduce((sum, source) => {
      const currentWorkParts = utils.getActiveBodyPartsFromName(source.harvesters, WORK)

      return sum + (currentWorkParts * HARVEST_POWER * 1500)
    }, 0)

    // this.logger.info(`energyProduced`, energyProduced)

    const creepsConsumingEnergy = context.plan.upgraders.concat(context.plan.builders)
    const energyConsumed = creepsConsumingEnergy.reduce((sum, creepName) => {
      const currentWorkParts = utils.getActiveBodyPartsFromName(creepName, WORK)

      return sum + (currentWorkParts * HARVEST_POWER * 1500)
    }, 0)
    const energyConsumedByWalls = 0

    // this.logger.info(`energyConsumed`, energyConsumed)

    const creepsInRoom: Creep[] = _.filter(Game.creeps, creep => creep.memory.roomName === context.roomName)
    const totalCreepsCost = utils.getCreepsCost(creepsInRoom)

//     this.logger.info(`totalCreepsCost`, totalCreepsCost)


    const total = energyProduced - energyConsumedByWalls - energyConsumed - totalCreepsCost

    const workParts = context.plan.upgradersBody.filter(part => part === WORK).length
    const consumeByUpgrader = workParts * HARVEST_POWER * 1500 + (_.sum(context.plan.upgradersBody.map(p => BODYPART_COST[p])))

//     console.log('consumeByUpgrader', consumeByUpgrader)
//     console.log('total', total)

    if (total >= consumeByUpgrader) {
      const creepName = this.createUpgrader(context)

      context.plan.upgraders.push(creepName)

      return this.waitNextTick()
    }

    return this.waitNextTick()
  }

  private calculateEficiency({ distance, work, move, carry }: { distance: number, work: number, move: number, carry: number }): number {
    const FATIGUE = 2

    if (!move || !carry || !work) {
      return 0
    }

    const ticksToUpgradeController = (carry * CARRY_CAPACITY) / work
    const ticksToTravelToStorage = (distance * work * FATIGUE) / (move * FATIGUE)
    const ticksToTravelToController = (distance * (work + carry) * FATIGUE) / (move * FATIGUE)

    const eficiency = (carry * CARRY_CAPACITY) / (ticksToTravelToController + ticksToUpgradeController + ticksToTravelToStorage)

    return eficiency
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

  private createBuilder(context: ICityContext): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: room.energyCapacityAvailable, ticksToMove: 2 })
      .add([CARRY, WORK], { repeat: true })
      .addMoveIfPossible()
      .value(),
      actions: [[CreepCheckStop.name], [CreepSingleBuilder.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createUpgrader(context: ICityContext): string {
    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory: {},
      creepName,
      body: context.plan.upgradersBody,
      actions: [[CreepCheckStop.name], [CreepSingleUpgrader.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createStoragers(context: ICityContext): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory: {},
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyAvailable })
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepStorager.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createHaulers(context: ICityContext, memory: any): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyCapacityAvailable })
      // .add([MOVE, CARRY, MOVE, WORK])
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepSingleHauler.name]],
      priority: PRIORITY.NORMAL
    })

    return creepName
  }

  private createHarvester(context: ICityContext, memory: any): string {
    const room: Room = Game.rooms[context.roomName]

    const creepName = utils.getUniqueCreepName()

    context.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: 300, energyAvailable: room.energyCapacityAvailable, ticksToMove: 3 })
      .add([CARRY, WORK, WORK, WORK, WORK, WORK, WORK])
      .addMoveIfPossible()
      .value(),
      actions: [[CreepCheckStop.name], [CreepHarvester.name]],
      priority: PRIORITY.NORMAL,
    })

    return creepName
  }

  private plan(context: ICityContext): void {
    const room: Room = Game.rooms[context.roomName]

    if (room.controller == null) {
      return
    }

    context.plan.rcl = room.controller.level
    context.plan.energyCapacity = room.energyCapacityAvailable
    context.plan.time = Game.time

    if (context.plan.sources == null) {
      const spawn: StructureSpawn = _.sample(room.find(FIND_MY_SPAWNS)) as StructureSpawn

      context.plan.sources = room.find(FIND_SOURCES).map((source: Source) => {
        const pathToSpawn = source.pos.findPathTo(spawn, {
          ignoreCreeps: true
        })

        return {
          id: source.id,
          harvesters: [],
          haulers: [],
          containerPos: pathToSpawn[0],
          distance: pathToSpawn.length,
          emptySpaces: utils.getEmptySpacesAroundPosition(source.pos).length,
          desiredWorkParts: 0,
          desiredCarryParts: 0
        }
      })

      context.plan.sources.sort((s1: any, s2: any) => s1.distance - s2.distance)
    }

    const maxWorkPartAllowedByEnergyCapacity = this.getMaxWorkPartAllowedByEnergyCapacity(context)

    for (const source of context.plan.sources) {
      const desiredWorkParts = Math.min(OPTIMUM_WORK_PARTS_PER_SOURCE, maxWorkPartAllowedByEnergyCapacity * source.emptySpaces)

      source.desiredWorkParts = desiredWorkParts
    }

    // build storage
    if (!room.storage && room.controller.level >= 4) {
      const constructionSite = room.find(FIND_MY_CONSTRUCTION_SITES, {
        filter: c => c.structureType === STRUCTURE_STORAGE
      })

      if (!constructionSite.length) {
        const emptySpaces = utils.getEmptySpacesAroundPosition(room.controller.pos)

        if (emptySpaces.length) {
          const emptySpace = emptySpaces[0]

          room.createConstructionSite(emptySpace.x, emptySpace.y, STRUCTURE_STORAGE)
        }
      }
    }

    // best upgraders body
    const goal = []

    if (room.storage) {
      goal.push(room.storage.pos)

    // TODO: has containers close to controller
    } else {
      const sources = room.find(FIND_SOURCES).map(source => source.pos)

      goal.push(...sources)
    }

    const distance = PathFinder.search(room.controller.pos, goal).path.length
    const permutations = this.generatePermutations(room.energyCapacityAvailable, distance / 3)

    let bestEntry: string = ''
    let bestEficiency = 0

    for (const key in permutations) {
      const eficiency = permutations[key]

      if (eficiency > bestEficiency) {
        bestEficiency = eficiency
        bestEntry = key
      }
    }

    context.plan.upgradersBody = bestEntry.split(',') as BodyPartConstant[]
  }

  private getMaxWorkPartAllowedByEnergyCapacity(context: ICityContext): number {
    const room: Room = Game.rooms[context.roomName]

    const maximumWorkerParts: number = Math.floor((room.energyCapacityAvailable - BODYPART_COST[MOVE] - BODYPART_COST[CARRY]) / BODYPART_COST[WORK])

    return maximumWorkerParts
  }
}
