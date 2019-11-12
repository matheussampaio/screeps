import * as _ from 'lodash'

import { ActionsRegistry, ACTIONS_RESULT } from '../../core'
import * as utils from '../../utils'
import { ICityContext } from './interfaces'
import { City } from './city'

@ActionsRegistry.register
export class CityBuilder extends City {
  run(context: ICityContext) {
    this.context = context

    if (this.map == null) {
      return this.waitNextTick()
    }

    if (_.size(Game.constructionSites) >= MAX_CONSTRUCTION_SITES) {
      return this.waitNextTick()
    }

    this.visualize()

    const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES).length

    if (constructionSites) {
      return this.sleep(50)
    }

    if (this.createConstructionSites()) {
      return this.waitNextTick()
    }

    if (this.pruneStructuresMissplaced()) {
      return this.sleep(5)
    }

    return this.sleep(100)
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
      constructionOrder.push(STRUCTURE_EXTENSION)
    }

    if (this.controller.level >= 3) {
      constructionOrder.push(STRUCTURE_ROAD, STRUCTURE_TOWER, STRUCTURE_WALL, STRUCTURE_RAMPART)
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

        positions.forEach(pos => this.room.createConstructionSite(pos.x, pos.y, structureType))

        if (positions.length) {
          return true
        }
      }
    }

    return false
  }

  private findStructuresToBeConstructed(structureType: BuildableStructureConstant): RoomPosition[] {
    const positions = []

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const st = this.getPos(x, y)

        if (st.includes(structureType)) {
          const result = this.room.lookAt(x, y)

          const isThereAConstructionSite = result.some(item => item.type === LOOK_CONSTRUCTION_SITES)

          if (isThereAConstructionSite) {
            continue
          }

          const alreadyConstructed = result.find(item => item.structure && item.structure.structureType === structureType)

          if (alreadyConstructed) {
            continue
          }

          positions.push(this.room.getPositionAt(x, y) as RoomPosition)
        }
      }
    }

    return positions
  }

  private visualize() {
    const flag = Game.flags['visual']

    if (flag == null) {
      return
    }

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const value = this.getPos(x, y)

        if (value.includes(STRUCTURE_ROAD)) {
          const neighbors = utils.getNeighborsCoords(x, y)

          neighbors.forEach(coord => {
            const v2 = this.getPos(coord.x, coord.y)

            if (v2.includes(STRUCTURE_ROAD)) {
              this.room.visual.line(x, y, coord.x, coord.y, { color: '#111111' })
            }
          })
        }

        if (value.includes(STRUCTURE_STORAGE)) {
          this.room.visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: '#ffff00', stroke: 'green' })
        }

        if (value.includes(STRUCTURE_SPAWN)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#ffff00', stroke: 'red' })
        }

        if (value.includes(STRUCTURE_EXTENSION)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#ffff00' })
        }

        if (value.includes(STRUCTURE_TOWER)) {
          this.room.visual.rect(x - 0.5, y - 0.5, 1, 1, { fill: '#ffff00', stroke: 'red' })
        }

        if (value.includes(STRUCTURE_WALL)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#000000', stroke: 'white' })
        }

        if (value.includes(STRUCTURE_RAMPART)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#00cc00', stroke: 'white' })
        }

        if (value.includes(STRUCTURE_EXTRACTOR)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#008080', stroke: 'red' })
        }

        if (value.includes(STRUCTURE_LINK)) {
          this.room.visual.poly([
            [x, y - 0.5],
            [x + 0.4, y],
            [x, y + 0.5],
            [x - 0.4, y],
            [x, y - 0.5]
          ], { fill: '#ffff00', stroke: 'green' })
        }

        if (value.includes(STRUCTURE_TERMINAL)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#0066cc', stroke: 'blue' })
        }

        if (value.includes(STRUCTURE_LAB)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#ff3399' })
        }

        if (value.includes(STRUCTURE_FACTORY)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#cc0000' })
        }

        if (value.includes(STRUCTURE_POWER_SPAWN)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#cc0000' })
        }

        if (value.includes(STRUCTURE_NUKER)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#cc0000' })
        }

        if (value.includes(STRUCTURE_OBSERVER)) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#006600' })
        }

        if (value.includes(STRUCTURE_CONTAINER)) {
          this.room.visual.rect(x - 0.3 , y - 0.4, 0.6, 0.8, { fill: '#ffffff', stroke: 'green' })
        }
      }
    }
  }
}


