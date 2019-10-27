import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import * as utils from '../../utils'

@ActionsRegistry.register
export class CityBuilder extends Action {
  private context: any

  run(context: any) {
    this.context = context

    if (this.mem.map == null) {
      return this.sleep(5)
    }

    if (_.size(Game.constructionSites) >= MAX_CONSTRUCTION_SITES) {
      return this.waitNextTick()
    }

    this.visualize()

    const constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES).length

    if (constructionSites) {
      return this.waitNextTick()
      // return this.sleep(5)
    }

    if (this.createConstructionSites()) {
      return this.waitNextTick()
    }

    if (!this.pruneStructuresMissplaced()) {
      return this.waitNextTick()
      // return this.sleep(5)
    }

    return this.waitNextTick()
    // return this.sleep(5)
  }

  private pruneStructuresMissplaced(): boolean {
    return this.prune(STRUCTURE_ROAD, 10) ||
      this.prune(STRUCTURE_EXTENSION, 1) ||
      this.prune(STRUCTURE_TOWER, 1) ||
      this.prune(STRUCTURE_STORAGE, 1)
  }

  private prune(structureType: BuildableStructureConstant, maxPrune = 100): boolean {
    const structures = this.room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === structureType
    })

    for (const structure of structures) {
      const desiredStructure = this.getPos(structure.pos.x, structure.pos.y)

      if (desiredStructure !== structureType) {
        console.log(`prune: destroying STRUCTURE. it should be ${desiredStructure}, but it is ${structure.structureType}`)

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

      if (desiredConstruction !== structureType) {
        console.log(`prune: destroying CONSTRUCTION. it should be ${desiredConstruction}, but it is ${constructionSite.structureType}`)

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

        if (st === structureType) {
          const result = this.room.lookAt(x, y)

          const isTileFree = result.every(item => item.type !== LOOK_STRUCTURES && item.type !== LOOK_CONSTRUCTION_SITES)

          if (isTileFree) {
            positions.push(this.room.getPositionAt(x, y) as RoomPosition)
          }
        }
      }
    }

    return positions
  }

  private get map(): (BuildableStructureConstant | null)[] {
    return this.mem.map
  }

  private getPos(x: number, y: number): BuildableStructureConstant | null {
    return this.map[y * 50 + x]
  }

  private get room(): Room {
    return Game.rooms[this.context.roomName]
  }

  private get controller(): StructureController {
    return this.room.controller as StructureController
  }

  private get mem(): any {
    return this.context.planner
  }

  private get center(): RoomPosition {
    const { x, y } = this.mem.center

    return this.room.getPositionAt(x, y) as RoomPosition
  }

  private visualize() {
    const flag = Game.flags['visual']

    if (flag == null) {
      return
    }

    this.room.visual.circle(this.center.x, this.center.y, { radius: 0.5, fill: '#00ff00' })

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const value = this.getPos(x, y)

        if (value === STRUCTURE_ROAD) {
          const neighbors = utils.getNeighborsCoords(x, y)

          neighbors.forEach(coord => {
            const v2 = this.getPos(coord.x, coord.y)

            if (v2 === STRUCTURE_ROAD) {
              this.room.visual.line(x, y, coord.x, coord.y, { color: '#000000', opacity: 0.5 })
            }
          })
        } else if (value === STRUCTURE_STORAGE) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#ff0000' })
        } else if (value === STRUCTURE_SPAWN) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#0000ff' })
        } else if (value === STRUCTURE_EXTENSION) {
          this.room.visual.circle(x, y, { radius: 0.5, fill: '#ff00ff' })
        }
      }
    }
  }
}

