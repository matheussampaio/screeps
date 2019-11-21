import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICityContext, IPlanMineral } from './interfaces'
import { City } from './city'
import { CreepCheckStop, CreepHaulerMineral, CreepHarvesterMineral } from '../creep'
import * as utils from '../../utils'
import { CreateBody, CREEP_PRIORITY } from '../../utils'

@ActionsRegistry.register
export class CityMinerals extends City {
  run(context: ICityContext) {
    this.context = context

    if (this.queue.length) {
      return this.sleep(5)
    }

    if (!CONTROLLER_STRUCTURES[STRUCTURE_EXTRACTOR][this.controller.level]) {
      return this.sleep(1000)
    }

    // if storage is full, wait
    if (this.storage == null || this.storage.store.getUsedCapacity() >= STORAGE_CAPACITY * 0.8) {
      return this.sleep(50)
    }

    if (this.planner.minerals == null) {
      return this.waitNextTick()
    }

    const mineralPlan = _.head(Object.values(this.planner.minerals)) as IPlanMineral

    if (mineralPlan == null) {
      return this.waitNextTick()
    }

    const mineral = Game.getObjectById(mineralPlan.id) as Mineral

    if (mineral == null) {
      return this.sleep(10)
    }

    if (!mineral.mineralAmount) {
      return this.sleep(mineral.ticksToRegeneration)
    }

    const extractor = mineral.pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_EXTRACTOR)

    if (extractor == null) {
      return this.sleep(10)
    }

    if (mineralPlan.containerPos == null) {
      return this.sleep(10)
    }

    const { x, y } = mineralPlan.containerPos

    const pos = this.room.getPositionAt(x, y) as RoomPosition

    const container = pos.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_CONTAINER) as StructureContainer

    if (container == null) {
      const constructionSite = pos.lookFor(LOOK_CONSTRUCTION_SITES).find(c => c.structureType === STRUCTURE_CONTAINER)

      if (constructionSite) {
        return this.sleep(10)
      }

      this.room.createConstructionSite(pos, STRUCTURE_CONTAINER)
      return this.sleep(10)
    } else {
      // TODO: spawn someone to repair the container
    }

    mineralPlan.harvesters = mineralPlan.harvesters.filter((creepName: string) => Game.creeps[creepName] != null)
    mineralPlan.haulers = mineralPlan.haulers.filter((creepName: string) => Game.creeps[creepName] != null)

    const currentWorkParts: number = utils.getActiveBodyPartsFromName(mineralPlan.harvesters, WORK)
    const currentCarryParts: number = utils.getActiveBodyPartsFromName(mineralPlan.haulers, CARRY)

    // While the Hauler is traveling from mineral to storage and back, the
    // Harvester should produce: WORK_PARTS * HARVEST_POWER * DISTANCE * 2
    // Our Haulers should have enough CARRY parts to carry all that resource.
    const mineralProduced = mineralPlan.distance * currentWorkParts * HARVEST_POWER * 2 / EXTRACTOR_COOLDOWN

    mineralPlan.desiredCarryParts = mineralProduced / CARRY_CAPACITY

    if (currentCarryParts * CARRY_CAPACITY < mineralProduced) {
      const memory = { mineral: mineral.id, containerPos: mineralPlan.containerPos }
      const creepName = this.createHaulersMineral(memory, { [CARRY]: mineralPlan.desiredCarryParts + 2 })

      mineralPlan.haulers.push(creepName)
    }

    const DESIRED_WORK_PARTS = 15

    if (mineralPlan.harvesters.length < mineralPlan.emptySpaces && currentWorkParts < DESIRED_WORK_PARTS) {
      const memory: any = { mineral: mineral.id, containerPos: mineralPlan.containerPos, extractor: extractor.id }
      const creepName = this.createHarvesterMineral(memory, { [WORK]: DESIRED_WORK_PARTS })

      mineralPlan.harvesters.push(creepName)
    }

    return this.sleep(5)
  }

  private createHaulersMineral(memory: any, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('hauler-min')

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: this.room.energyCapacityAvailable, maxParts })
      .add([CARRY], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepHaulerMineral.name]],
      priority: CREEP_PRIORITY.HAULER_MINERAL
    })

    return creepName
  }

  private createHarvesterMineral(memory: any, maxParts: Partial<Record<BodyPartConstant, any>>): string {
    const creepName = utils.getUniqueCreepName('harv-min')

    this.queue.push({
      memory,
      creepName,
      body: new CreateBody({ minimumEnergy: this.room.energyCapacityAvailable, maxParts })
      .add([WORK], { repeat: true })
      .value(),
      actions: [[CreepCheckStop.name], [CreepHarvesterMineral.name]],
      priority: CREEP_PRIORITY.HARVESTER_MINERAL
    })

    return creepName
  }
}

