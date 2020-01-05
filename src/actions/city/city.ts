import * as _ from 'lodash'

import { Action } from '../../core'
import { ISpawnerItem, IPlanSource } from './interfaces'
import * as utils from '../../utils'

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

  protected get repairs(): string[] {
    if (this.planner.repairs == null) {
      this.planner.repairs = []
    }

    return this.planner.repairs
  }

  protected set repairs(value: string[]) {
    this.planner.repairs = value
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
    if (this.room.memory.map == null) {
      this.room.memory.map = this.planner.map || Array(50 * 50).fill([])
    }

    return this.room.memory.map
  }

  protected getPos(x: number, y: number): BuildableStructureConstant[] {
    return this.map[y * 50 + x]
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

  protected findLink(hasPos: { x: number, y: number } | undefined | null): StructureLink | ConstructionSite | null {
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

  protected search(pos: RoomPosition | RoomPosition[], costMatrix: CostMatrix, range = 1): PathFinderPath {
    const opts: PathFinderOpts = {
      roomCallback: (roomName: string): boolean | CostMatrix => {
        if (roomName === this.room.name) {
          return costMatrix
        }

        return false
      },
      plainCost: 2,
      swampCost: 5
    }

    const positions = _.isArray(pos) ? pos : [pos]

    const goals = positions.map(pos => ({ pos, range }))

    return PathFinder.search(this.center, goals, opts)
  }

}
