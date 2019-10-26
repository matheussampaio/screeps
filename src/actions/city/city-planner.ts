import * as _ from 'lodash'

import { ActionsRegistry, Action, ACTIONS_RESULT } from '../../core'
import * as utils from '../../utils'

const ROAD = 1

@ActionsRegistry.register
export class CityPlanner extends Action {
  private context: any

  run(context: any): [ACTIONS_RESULT, ...string[]] {
    this.context = context

    // DEV: remove when done
    // force calculations every tick
    context.planner = null

    const costMatrix = new PathFinder.CostMatrix()

    const exits = [
      FIND_EXIT_TOP,
      FIND_EXIT_RIGHT,
      FIND_EXIT_BOTTOM,
      FIND_EXIT_LEFT
    ]

    // block tiles around controller
    utils.getEmptySpacesAroundPosition(this.controller.pos).forEach(pos => {
      costMatrix.set(pos.x, pos.y, Infinity)
    })

    const sources = this.room.find(FIND_SOURCES)

    // block tiles around sources
    for (const source of sources) {
      utils.getEmptySpacesAroundPosition(source.pos).forEach(pos => {
        costMatrix.set(pos.x, pos.y, 5)
      })
    }

    // block and plan roads to sources
    for (const source of sources) {
      const result = this.search(costMatrix, source.pos)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path) {
        costMatrix.set(pos.x, pos.y, 1)
        this.setPos(pos.x, pos.y, ROAD)
      }
    }

    // block and plan roads to exits
    for (const exit of exits) {
      const exitPosition = this.room.find(exit)

      if (exitPosition == null) {
        continue
      }

      const result = this.search(costMatrix, exitPosition, 0)

      if (result.incomplete) {
        continue
      }

      for (const pos of result.path) {
        costMatrix.set(pos.x, pos.y, 1)
        this.setPos(pos.x, pos.y, ROAD)
      }
    }

    this.visualize(costMatrix)

    return this.waitNextTick()
  }

  private get map(): number[] {
    return this.mem.map || (this.mem.map = Array(50 * 50).fill(0))
  }

  private getPos(x: number, y: number): number {
    return this.map[y * 50 + x]
  }

  private setPos(x: number, y: number, value: number) {
    return this.map[y * 50 + x] = value
  }

  private search(costMatrix: CostMatrix, pos: RoomPosition | RoomPosition[], range = 1): PathFinderPath {
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

  private get room(): Room {
    return Game.rooms[this.context.roomName]
  }

  private get controller(): StructureController {
    return this.room.controller as StructureController
  }

  private get mem() {
    return this.context.planner || (this.context.planner = {})
  }

  private get center(): RoomPosition {
    if (this.mem.center) {
      const { x, y } = this.mem.center

      return this.room.getPositionAt(x, y) as RoomPosition
    }

    const queue = utils.getEmptySpacesAroundPosition(this.controller.pos, 3)

    queue.sort((p1, p2) => {
      const ep1 = utils.getEmptySpacesAroundPosition(p1).length
      const ep2 = utils.getEmptySpacesAroundPosition(p2).length

      return ep2 - ep1
    })

    const center = _.head(queue) || this.controller.pos

    this.mem.center = {
      x: center.x,
      y: center.y
    }

    return center
  }

  private visualize(costMatrix: CostMatrix) {
    const coords: [number, number][] = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1]
    ]

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const value = this.getPos(x, y)

        if (value === ROAD) {
          const neighbors = utils.getNeighborsCoords(x, y)

          neighbors.forEach(coord => {
            const v2 = this.getPos(coord.x, coord.y)

            if (v2 === ROAD || (coord.x === this.center.x && coord.y === this.center.y)) {
              this.room.visual.line(x, y, coord.x, coord.y, { color: '#ff0000', opacity: 1 })
            }
          })
        }

        if (costMatrix.get(x, y)) {
          this.room.visual.text(costMatrix.get(x, y).toString(), x, y, { align: 'center' })
        }
      }
    }

    this.room.visual.circle(this.center.x, this.center.y, { radius: 0.5, fill: '#00ff00' })
  }
}

