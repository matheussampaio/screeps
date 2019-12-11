import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICityContext } from './interfaces'
import { City } from './city'
import * as utils from '../../utils'

interface ConstructionSiteCache {
  tick: number
  rooms: {
    [roomName: string]: ConstructionSite[]
  }
}

const _cache: ConstructionSiteCache = {
  tick: 0,
  rooms: {}
}

@ActionsRegistry.register
export class CityBuilder extends City {
  run(context: ICityContext) {
    this.context = context

    if (this.map == null) {
      return this.sleep(50)
    }

    if (_.size(Game.constructionSites) >= MAX_CONSTRUCTION_SITES) {
      return this.sleep(50)
    }

    if (this.constructionSites.length) {
      return this.sleep(Math.max(...this.constructionSites.map(s => (s.progressTotal - s.progressTotal) / 25)))
    }

    if (this.createConstructionSites()) {
      return this.sleep(50)
    }

    if (this.pruneStructuresMissplaced()) {
      return this.sleep(50)
    }

    if (this.createLinks()) {
      return this.sleep(50)
    }

    return this.sleep(50)
  }

  private get constructionSites(): ConstructionSite[] {
    if (_cache.tick !== Game.time) {
      _cache.tick = Game.time
      _cache.rooms = _.groupBy(Game.constructionSites, 'room.name')
    }

    return _cache.rooms[this.room.name] || []
  }

  private createLinks(): boolean {
    const positions = [
      this.planner.storageLinkPos,
      ...this.sources.sort((a, b) => b.distance - a.distance).map(s => s.linkPos)
    ]

    let constructedLink = false

    for (let i = 0; i < CONTROLLER_STRUCTURES[STRUCTURE_LINK][this.controller.level] && positions.length; i++) {
      const hasPos = positions.shift() as { x: number, y: number }

      const link = this.findLink(hasPos)

      if (link == null) {
        const pos = this.room.getPositionAt(hasPos.x, hasPos.y) as RoomPosition

        this.room.createConstructionSite(pos, STRUCTURE_LINK)

        constructedLink = true
      }
    }

    return constructedLink
  }

  private pruneStructuresMissplaced(): boolean {
    return this.prune(STRUCTURE_ROAD) ||
      this.prune(STRUCTURE_WALL) ||
      this.prune(STRUCTURE_RAMPART) ||
      this.prune(STRUCTURE_EXTENSION) ||
      this.prune(STRUCTURE_TOWER) ||
      this.prune(STRUCTURE_LINK) ||
      this.prune(STRUCTURE_TERMINAL) ||
      this.prune(STRUCTURE_LAB) ||
      this.prune(STRUCTURE_STORAGE)
  }

  private prune(structureType: BuildableStructureConstant, maxPrune = Infinity): boolean {
    const structures = this.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === structureType
    })

    for (const structure of structures) {
      const desiredStructures = this.getPos(structure.pos.x, structure.pos.y)

      if (!desiredStructures.includes(structure.structureType as any)) {

        structure.destroy()
        maxPrune--

        if (!maxPrune) {
          return true
        }
      }
    }

    const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: s => s.structureType === structureType
    })

    for (const constructionSite of constructionSites) {
      const desiredConstruction = this.getPos(constructionSite.pos.x, constructionSite.pos.y)

      if (!desiredConstruction.includes(structureType)) {
        constructionSite.remove()
        maxPrune--

        if (!maxPrune) {
          return true
        }
      }
    }

    return false
  }

  private createConstructionSites(): boolean {
    const constructionOrder: BuildableStructureConstant[] = []

    if (this.controller.level >= 2) {
      constructionOrder.push(STRUCTURE_CONTAINER, STRUCTURE_EXTENSION)
    }

    if (this.controller.level >= 3) {
      constructionOrder.push(STRUCTURE_TOWER, STRUCTURE_WALL, STRUCTURE_RAMPART)
    }

    if (this.controller.level >= 4) {
      constructionOrder.push(STRUCTURE_STORAGE)
    }

    if (this.controller.level >= 6) {
      constructionOrder.push(STRUCTURE_SPAWN, STRUCTURE_EXTRACTOR, STRUCTURE_TERMINAL, STRUCTURE_LAB)
    }

    if (this.controller.level >= 7) {
      constructionOrder.push(STRUCTURE_FACTORY)
    }

    if (this.controller.level >= 8) {
      constructionOrder.push(STRUCTURE_POWER_SPAWN, STRUCTURE_NUKER, STRUCTURE_OBSERVER)
    }

    const structures = this.room.find(FIND_STRUCTURES)

    const positions = this.findStructuresToBeConstructed()

    for (const structureType of constructionOrder) {
      const structureCounter = structures.filter(s => s.structureType === structureType).length + this.constructionSites.filter(s => s.structureType === structureType).length

      if (structureCounter >= CONTROLLER_STRUCTURES[structureType][this.controller.level]) {
        continue
      }

      const constructionSitesPositions = positions.filter(e => e.structureType === structureType)

      for (const site of constructionSitesPositions) {
        this.room.createConstructionSite(site.pos.x, site.pos.y, structureType)

        if (structureType !== STRUCTURE_WALL && structureType !== STRUCTURE_EXTRACTOR && structureType !== STRUCTURE_RAMPART) {
          const costMatrix = PathFinder.CostMatrix.deserialize(this.planner.costMatrix)

          const result = this.search(site.pos, costMatrix)

          if (!result.incomplete) {
            for (const pos of result.path) {
              this.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD)
            }
          }
        }
      }

      if (constructionSitesPositions.length) {
        console.log('created', structureType, positions)
        return true
      }
    }

    return false
  }

  private findStructuresToBeConstructed(): { pos: RoomPosition, structureType: BuildableStructureConstant }[] {
    const queue = [this.center]
    const visited = Array(50 * 50).fill(0)

    const positions = []

    while (queue.length) {
      const pos = queue.shift() as RoomPosition
      const idx = pos.y * 50 + pos.x

      if (visited[idx]) {
        continue
      }

      visited[idx] = 1

      // queue their neighbors to the be visited
      const neighbors = utils.getNeighborsPositions(pos, { closeToExits: false })

      queue.push(...neighbors)

      const { x, y } = pos

      const structuresToBeConstructed = this.getPos(x, y)

      for (const structureType of structuresToBeConstructed) {
        const result = this.room.lookAt(x, y)

        const alreadyConstructed = result.find(item => item.structure && item.structure.structureType === structureType)

        if (alreadyConstructed) {
          continue
        }

        if (structureType !== STRUCTURE_ROAD && structureType !== STRUCTURE_RAMPART) {
          const hasAConstructionThere = result.find(item => item.structure && item.structure.structureType !== structureType)

          if (hasAConstructionThere) {
            continue
          }
        }

        if (structureType === STRUCTURE_CONTAINER) {
          const sources = this.room.find(FIND_SOURCES)

          const isHarvesterContainer = sources.some(source => source.pos.isNearTo(pos))

          if (!isHarvesterContainer) {
            continue
          }
        }

        positions.push({ pos, structureType })
      }
    }

    return positions
  }
}
