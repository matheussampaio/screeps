import * as _ from 'lodash'

import { Action } from '../../core'
import { ISpawnerItem, IPlanSource } from './interfaces'
import * as utils from '../../utils'

const cms: any = {}

export class City extends Action {
  protected context: any
  protected process: any

// With 6 WORK parts, a creep can farm 3600 in 300 ticks (6 * 2 * 300).
// It's more than enough to farm a 3k source.
  protected OPTIMUM_WORK_PARTS_PER_SOURCE: number = 6

  protected get room(): Room {
    return Game.rooms[this.context.roomName as string]
  }

  protected get controller(): StructureController {
    return this.room.controller as StructureController
  }

  protected get storage(): StructureStorage | undefined {
    return this.room.storage
  }

  protected get queue(): ISpawnerItem[] {
    if (this.context.queue == null) {
      this.context.queue = []
    }

    return this.context.queue
  }

  protected get planner() {
    if (this.context.planner == null) {
      this.context.planner = {}
    }

    return this.context.planner
  }

  protected get storagers(): string[] {
    if (this.planner.storagers == null) {
      this.planner.storagers = []
    }

    return this.planner.storagers
  }

  protected set storagers(value: string[]) {
    this.planner.storagers = value
  }

  protected get builders(): string[] {
    if (this.planner.builders == null) {
      this.planner.builders = []
    }

    return this.planner.builders
  }

  protected set builders(value: string[]) {
    this.planner.builders = value
  }

  protected get upgraders(): string[] {
    if (this.planner.upgraders == null) {
      this.planner.upgraders = []
    }

    return this.planner.upgraders
  }

  protected set upgraders(value: string[]) {
    this.planner.upgraders = value
  }

  protected get sources(): IPlanSource[] {
    if (this.planner.sources == null) {
      this.planner.sources = {}
    }

    return Object.values(this.planner.sources)
  }

  protected get upgradersBody(): BodyPartConstant[] {
    if (this.planner.upgradersBody == null) {
      this.planner.upgradersBody = []
    }

    return this.planner.upgradersBody
  }

  protected set upgradersBody(body: BodyPartConstant[]) {
    this.planner.upgradersBody = body
  }

  protected get emergencyCreep(): string {
    if (this.context.emergencyCreep == null) {
      this.context.emergencyCreep = ''
    }

    return this.context.emergencyCreep
  }

  protected get map(): BuildableStructureConstant[][] {
    if (this.planner.map == null) {
      this.planner.map = Array(50 * 50).fill([])
    }

    return this.planner.map
  }

  protected getPos(x: number, y: number): BuildableStructureConstant[] {
    return this.map[y * 50 + x]
  }

  protected setPos(x: number, y: number, value: BuildableStructureConstant[], force: boolean = false) {
    const idx = y * 50 + x

    if (this.map[idx].length === 0 || force) {
      this.map[y * 50 + x] = value
      this.costMatrix.set(x, y, value.includes(STRUCTURE_ROAD) ? 1 : Infinity)
    }
  }

  protected get costMatrix(): CostMatrix {
    const cm = cms[this.room.name] || (cms[this.room.name] = {})

    if (cm.time !== Game.time) {
      cm.time = Game.time
      cm.matrix = new PathFinder.CostMatrix()

      const roads = this.room.find(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_ROAD
      })

      roads.forEach(road => cm.matrix.set(road.pos.x, road.pos.y, 1))
    }

    return cm.matrix
  }

  protected get center(): RoomPosition {
    if (this.planner.center == null) {
      const queue = utils.getEmptySpacesAroundPosition(this.controller.pos, { range: 3, closeToExits: false })

      queue.sort((p1, p2) => {
        const ep1 = utils.getEmptySpacesAroundPosition(p1).length
        const ep2 = utils.getEmptySpacesAroundPosition(p2).length

        return ep2 - ep1
      })

      const center = _.head(queue) || this.controller.pos

      this.planner.center = {
        x: center.x,
        y: center.y
      }
    }

    const { x, y } = this.planner.center

    return this.room.getPositionAt(x, y) as RoomPosition
  }

  protected isCreepNameInQueue(creepName: string): boolean {
    return this.queue.some(item => item.creepName === creepName)
  }

  protected getMaxWorkPartAllowedByEnergyCapacity(): number {
    return Math.floor(
      (this.room.energyCapacityAvailable - BODYPART_COST[MOVE] - BODYPART_COST[CARRY]) / BODYPART_COST[WORK]
    )
  }

  protected isSpawningCreep(creepNames: string[]): boolean {
    return creepNames.some(creepName => this.isCreepNameInQueue(creepName) || (Game.creeps[creepName] && Game.creeps[creepName].spawning))
  }
}
