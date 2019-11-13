import { ActionsRegistry } from '../../core'
import * as utils from '../../utils'
import { ICityContext } from './interfaces'
import { City } from './city'

@ActionsRegistry.register
export class CityVisuals extends City {
  run(context: ICityContext) {
    this.context = context

    if (this.room == null) {
      return this.waitNextTick()
    }

    if (Game.flags['visual']) {
      for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
          this.addStructureVisual(x, y)
        }
      }
    }

    return this.waitNextTick()
  }

  private addStructureVisual(x: number, y: number) {
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
