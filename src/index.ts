import * as _ from 'lodash'

import { MinCut, RoomCellType, RectCoordinates, Coordinates } from './min-cut'

export function loop() {
  if (Game.time % 1000 === 0) {
    const startCPU: number = Game.cpu.getUsed()

    // Rectangle Array, the Rectangles will be protected by the returned tiles
    const protectedArea: RectCoordinates[] = [
      { x1: 11, y1: 16, x2: 30, y2: 26 }
    ]

    // Boundary Array for Maximum Range
    const bounds: RectCoordinates = { x1: 0, y1: 0, x2: 49, y2: 49 }

    const positions: Coordinates[] = MinCut.GetCutTiles('sim', protectedArea, bounds)

    console.log(`Positions returned: ${positions.length}`)
    console.log(`Needed ${Game.cpu.getUsed() - startCPU} cpu time`)
  }

  placeStructures({ room: Game.rooms.sim, x: 6, y: 7 })
}

function placeStructures({ room, x, y }: { room: Room, x: number, y: number }): void {
  const room2d = MinCut.getRoom2D(room.name)
  const center = room.getPositionAt(x, y)

  reservePathToExits(room2d, center, room)

  const structures = getStructures()

  for (const structure of structures) {
    placeStructure(room2d, center, structure)
  }

  addVisuals(room.name, room2d)
}

function reservePathToExits(room2d: number[][], center: RoomPosition, room: Room) {
  const exits = [
    FIND_EXIT_TOP,
    FIND_EXIT_RIGHT,
    FIND_EXIT_BOTTOM,
    FIND_EXIT_LEFT
  ]

  for (const exit of exits) {
    const target = room.find(exit)

    if (target == null) {
      continue
    }

    const result = PathFinder.search(center, target)

    if (result.incomplete) {
      continue
    }

    for (const pos of result.path) {
      room2d[pos.x][pos.y] = Road.id
    }
  }

  const sources = room.find(FIND_SOURCES)

  for (const source of sources) {
    const result = PathFinder.search(center, { pos: source.pos, range: 1 })

    if (result.incomplete) {
      continue
    }

    for (const pos of result.path) {
      room2d[pos.x][pos.y] = Road.id
    }
  }

  const result = PathFinder.search(center, { pos: room.controller.pos, range: 1 })

  if (result.incomplete) {
    return
  }

  for (const pos of result.path) {
    room2d[pos.x][pos.y] = Road.id
  }
}

function placeStructure(room2d: number[][], center: RoomPosition, structure: any) {
  console.log('placing', structure.name)
  const UNVISITED = 0
  const WAITING = 1
  const VISITED = 2

  const queue: any[] = [ center ]
  const visited = Array(50 * 50).fill(UNVISITED)

  while (queue.length) {
    const { x, y } = queue.shift()

    const idx = y * 50 + x

    if (visited[idx] === VISITED) {
      continue
    }

    visited[y * 50 + x] = VISITED

    if (room2d[x][y] === RoomCellType.NORMAL && structure.place(room2d, center, x, y)) {
      return true
    }

    const neighbors = getNeighbors(x, y)

    console.log(neighbors.length)

    for (const neighbor of neighbors) {
      const idx = neighbor.y * 50 + neighbor.x

      console.log('is visited?', visited[idx], neighbor.x, neighbor.y)

      if (visited[idx] === UNVISITED) {
        console.log('queing', idx)

        visited[idx] = WAITING
        queue.push({ x: neighbor.x, y: neighbor.y })
      }
    }
  }

  console.log(`Can't find a place for`, structure.name)

  return false
}

function getNeighbors(x: number, y: number): { x: number, y: number}[] {
  const surr: number[][] = [
    [-1, -1], [ 0, -1], [ 1, -1],
    [-1,  0], /*x, y*/  [ 1,  0],
    [-1,  1], [ 0,  1], [ 1,  1],
  ]

  const neighbors = []

  for (const p of surr) {
    const dx = x + p[0]
    const dy = y + p[1]

    if (dx < 0 || dy < 0 || dx > 49 || dy > 49) {
      continue
    }

    neighbors.push({ x: dx, y: dy })
  }

  return _.shuffle(neighbors)
}

function addVisuals(roomName: string, room2d: number[][]) {
  const visual = new RoomVisual(roomName)

  const structures: any[] = [
    Storage,
    Extension,
    Road,
    Spawner,
    Link,
    Nuker,
    Observer,
    Tower,
    Terminal,
    Lab
  ]

  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      const v = room2d[x][y]

      const structure = structures.find(s => s.id === v)

      if (structure) {
        visual.circle(x, y, { radius: 0.5, fill: structure.color, opacity: 1 })
      }
    }
  }

  return visual
}

function getStructures(): IStructure[] {
  return [
    Storage,
    // Link,
    // Spawner, Spawner, Spawner,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    Extension, Extension, Extension, Extension, Extension,
    // Tower, Tower, Tower, Tower, Tower, Tower,
    // Terminal,
    // Lab, Lab, Lab, Lab, Lab,
    // Lab, Lab, Lab, Lab, Lab,
    // Nuker, Observer,
  ]
}

class IStructure {
  public static color: string
  public static id: number

  public static place(room2d: number[][], center: RoomPosition, x: number, y: number, id: number): boolean {
    const neighbors = getNeighbors(x, y)

    const hasARoad = neighbors.find(pos => room2d[pos.x][pos.y] === Road.id)

    if (hasARoad) {
      room2d[x][y] = id

      return true
    }

    const hasAnEmptyTile = neighbors.find(pos => room2d[pos.x][pos.y] === RoomCellType.NORMAL)

    if (hasAnEmptyTile) {
      room2d[hasAnEmptyTile.x][hasAnEmptyTile.y] = Road.id
      room2d[x][y] = id

      return true
    }

    return false
  }
}

class Storage extends IStructure {
  public static color = '#ffffff'
  public static id = 108

  public static place(room2d: number[][], center: RoomPosition, x: number, y: number): boolean {
    return IStructure.place(room2d, center, x, y, Storage.id)
  }
}

class Extension extends IStructure {
  public static color = '#ffff00'
  public static id = 101

  public static place(room2d: number[][], center: RoomPosition, x: number, y: number): boolean {
    return IStructure.place(room2d, center, x, y, Extension.id)
  }
}

class Spawner extends IStructure {
  public static color = '#ff0000'
  public static id = 102

  public static place(room2d: number[][], center: RoomPosition, x: number, y: number): boolean {
    return IStructure.place(room2d, center, x, y, Extension.id)
  }
}

class Road extends IStructure {
  public static color = '#606060'
  public static id = 103
}

class Lab extends IStructure {
  public static color = '#808080'
  public static id = 104
}

class Tower extends IStructure {
  public static color = '#0000ff'
  public static id = 105
}

class Nuker extends IStructure {
  public static color = '#ff00ff'
  public static id = 106
}

class Observer extends IStructure {
  public static color = '#00ffff'
  public static id = 107
}

class Link extends IStructure {
  public static color = '#f0fff0'
  public static id = 109
}

class Terminal extends IStructure {
  public static color = '#ffcc00'
  public static id = 110
}
