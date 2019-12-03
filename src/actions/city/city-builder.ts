import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICityContext } from './interfaces'
import { City } from './city'
import * as utils from '../../utils'

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

    const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: s => s.structureType !== STRUCTURE_CONTAINER
    }).length

    if (constructionSites) {
      return this.sleep(50)
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
    return this.prune(STRUCTURE_ROAD, 10) ||
      this.prune(STRUCTURE_EXTENSION, 1) ||
      this.prune(STRUCTURE_TOWER, 1) ||
      this.prune(STRUCTURE_STORAGE, 1) ||
      this.prune(STRUCTURE_LINK, 1) ||
      this.prune(STRUCTURE_TERMINAL, 1) ||
      this.prune(STRUCTURE_LAB, 1) ||
      this.prune(STRUCTURE_WALL, 50) ||
      this.prune(STRUCTURE_RAMPART, 50)
  }

  private prune(structureType: BuildableStructureConstant, maxPrune = 100): boolean {
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
    const sites = this.room.find(FIND_CONSTRUCTION_SITES)

    for (const structureType of constructionOrder) {
      const structureCounter = structures.filter(s => s.structureType === structureType).length + sites.filter(s => s.structureType === structureType).length

      if (structureCounter < CONTROLLER_STRUCTURES[structureType][this.controller.level]) {
        const positions = this.findStructuresToBeConstructed(structureType)

        for (const pos of positions) {
          this.room.createConstructionSite(pos.x, pos.y, structureType)

          if (structureType !== STRUCTURE_WALL && structureType !== STRUCTURE_EXTRACTOR && structureType !== STRUCTURE_RAMPART) {
            const costMatrix = PathFinder.CostMatrix.deserialize(this.planner.costMatrix)

            const result = this.search(pos, costMatrix)

            if (!result.incomplete) {
              for (const pos of result.path) {
                this.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD)
              }
            }
          }
        }

        if (positions.length) {
          return true
        }
      }
    }

    return false
  }

  private findStructuresToBeConstructed(structureType: BuildableStructureConstant): RoomPosition[] {
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

      const st = this.getPos(x, y)

      if (!st.includes(structureType)) {
        continue
      }

      const result = this.room.lookAt(x, y)

      const alreadyConstructed = result.find(item => item.structure && item.structure.structureType === structureType)

      if (alreadyConstructed) {
        continue
      }

      if (structureType === STRUCTURE_CONTAINER) {
        const sources = this.room.find(FIND_SOURCES)

        const isHarvesterContainer = sources.some(source => source.pos.isNearTo(pos))

        if (!isHarvesterContainer) {
          continue
        }
      }

      if (structureType !== STRUCTURE_WALL && structureType !== STRUCTURE_RAMPART) {
        return [pos]
      } else {
        positions.push(pos)
      }
    }

    return positions
  }
}
