import { Action, ActionRegistry, CreepRoleRegistry } from '@sae/core'

@ActionRegistry.register
export class FindBasePositionRoomAction extends Action {
  run(room) {
    const MAP_WIDTH_HEIGHT = 11

    const data = {
      get(x, y) {
        const key = `${x},${y}`

        return this[key] || (this[key] = { x, y })
      }
    }

    // calculate max square from this cell
    // tslint:disable-next-line:no-increment-decrement
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        const node = data.get(x, y)

        node.size = 0
        node.terrain = Game.map.getTerrainAt(x, y, room.name)

        if (node.terrain === 'wall') {
          node.size = 0
        } else if (x === 0 || y === 0) {
          node.size = 1
        } else {
          const west = data.get(x - 1, y)
          const north = data.get(x, y - 1)
          const northwest = data.get(x - 1, y - 1)

          if (west.size === north.size && north.size === northwest.size) {
            node.size = Math.min(MAP_WIDTH_HEIGHT, north.size + 1)
          } else {
            node.size = _.min([west.size, north.size, northwest.size]) + 1
          }
        }
      }
    }

    // calculate swamps inside each square
    for (let y = 0; y < 50; y++) {
      for (let x = 0; x < 50; x++) {
        const node = data.get(x, y)

        node.swamps = -1

        // skip small squares
        if (node.size >= MAP_WIDTH_HEIGHT) {
          let swamps = 0

          for (let _y = y - MAP_WIDTH_HEIGHT + 1; _y <= y; _y++) {
            for (let _x = x - MAP_WIDTH_HEIGHT + 1; _x <= x; _x++) {
              if (data.get(_x, _y).terrain === 'swamp') {
                swamps += 1
              }
            }
          }

          node.swamps = swamps
        }
      }
    }

    // room's center position
    const centers = [[24, 24], [25, 24], [24, 25], [25, 25]]

    // translate positions and calculate distance to the center of the room
    for (const key in data) {
      if (data[key].size >= MAP_WIDTH_HEIGHT) {
        data[key].x -= Math.floor(MAP_WIDTH_HEIGHT / 2)
        data[key].y -= Math.floor(MAP_WIDTH_HEIGHT / 2)
        data[key].dist = _.min(centers.map(pos => Math.hypot(pos[0] - data[key].x, pos[1] - data[key].y)))
      }
    }

    // get best candidate
    const best = _.values(data)
      .filter(node => node.size >= MAP_WIDTH_HEIGHT)
      .sort((a, b) => {
        if (a.swamps !== b.swamps) {
          return a.swamps - b.swamps
        }

        return a.dist - b.dist
      })

    // if none is found, we should try with a smaller template
    if (best.length) {
      room.memory.center = {
        x: best[0].x,
        y: best[0].y
      }
    }

    // TODO: Idle for some ticks
    return this.shiftAndContinue()
  }
}
