import { Graph } from './graph'

export enum RoomCellType {
  UNWALKABLE = -1,
  NORMAL = 0,
  PROTECTED = 1,
  TO_EXIT = 2,
  EXIT = 3
}

export type Room2D = RoomCellType[][]

export type RectCoordinates = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type Coordinates = {
  x: number
  y: number
}

const ROOM_SIZE = 50

const surr: number[][] = [
  [-1, -1], [ 0, -1], [ 1, -1],
  [-1,  0], /*x, y*/  [ 1,  0],
  [-1,  1], [ 0,  1], [ 1,  1],
]

export class MinCut {
  // Function to create Source, Sink, Tiles arrays: takes a rectangle-Array as input for Tiles that are to Protect
  // rects have top-left/bot_right Coordinates {x1,y1,x2,y2}
  private static createGraph(roomName: string, rect: RectCoordinates[], bounds: RectCoordinates) {
    const room2d: Room2D = MinCut.getRoom2D(roomName, bounds) // An Array with Terrain information: -1 not usable, 2 Sink (Leads to Exit)

    // Check bounds
    if (
      bounds.x1 >= bounds.x2 ||
      bounds.y1 >= bounds.y2 ||
      bounds.x1 < 0 ||
      bounds.y1 < 0 ||
      bounds.x2 > 49 ||
      bounds.y2 > 49
    ) {
      throw new Error(`ERROR: Invalid bounds: ${JSON.stringify(bounds)}`)
    }

    for (let i = 0; i < rect.length; i++) {
      // For all Rectangles, set edges as source (to protect area) and area as unused
      const r = rect[i]

      // Test sizes of rectangles
      if (r.x1 >= r.x2 || r.y1 >= r.y2) {
        throw new Error(`ERROR: Rectangle Nr. ${i} ${JSON.stringify(r)} invalid.`)
      }

      if (r.x1 < bounds.x1 || r.x2 > bounds.x2 || r.y1 < bounds.y1 || r.y2 > bounds.y2) {
        throw new Error(`ERROR: Rectangle Nr. ${i} ${JSON.stringify(r)} out of bounds: ${JSON.stringify(bounds)}`)
      }

      for (let x = r.x1; x < r.x2 + 1; x++) {
        for (let y = r.y1; y < r.y2 + 1; y++) {
          if (x === r.x1 || x === r.x2 || y === r.y1 || y === r.y2) {
            if (room2d[x][y] === RoomCellType.NORMAL) {
              room2d[x][y] = RoomCellType.PROTECTED
            }
          } else {
            room2d[x][y] = RoomCellType.UNWALKABLE
          }
        }
      }
    }

    // ********************** Visualisierung
    const visual = new RoomVisual(roomName)

    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        if (room2d[x][y] === RoomCellType.UNWALKABLE)
          visual.circle(x, y, { radius: 0.5, fill: '#111166', opacity: 0.3 })
        else if (room2d[x][y] === RoomCellType.NORMAL)
          visual.circle(x, y, { radius: 0.5, fill: '#e8e863', opacity: 0.3 })
        else if (room2d[x][y] === RoomCellType.PROTECTED) {
          visual.circle(x, y, { radius: 0.5, fill: '#75e863', opacity: 0.3 })
        } else if (room2d[x][y] === RoomCellType.TO_EXIT) {
          visual.circle(x, y, { radius: 0.5, fill: '#b063e8', opacity: 0.3 })
        }
      }
    }

    // initialise graph
    // possible 2*50*50 +2 (st) Vertices (Walls etc set to unused later)
    const graph = new Graph(2 * 50 * 50 + 2)
    const infini = Number.MAX_VALUE

    // per Tile (0 in Array) top + bot with edge of c=1 from top to bott  (use every tile once!)
    // infini edge from bot to top vertices of adjacent tiles if they not protected (array =1) (no reverse edges in normal graph)
    // per prot. Tile (1 in array) Edge from source to this tile with infini cap.
    // per exit Tile (2in array) Edge to sink with infini cap.
    // source is at  pos 2*50*50, sink at 2*50*50+1 as first tile is 0,0 => pos 0
    // top vertices <-> x,y : v=y*50+x   and x= v % 50  y=v/50 (math.floor?)
    // bot vertices <-> top + 2500
    const source = 2 * 50 * 50
    const sink = 2 * 50 * 50 + 1

    for (let x = 1; x < 49; x++) {
      for (let y = 1; y < 49; y++) {
        const top = y * 50 + x
        const bot = top + 2500
        if (room2d[x][y] === RoomCellType.NORMAL) {
          // normal Tile
          graph.newEdge(top, bot, 1)
          for (let i = 0; i < 8; i++) {
            const dx = x + surr[i][0]
            const dy = y + surr[i][1]
            if (room2d[dx][dy] === RoomCellType.NORMAL || room2d[dx][dy] === RoomCellType.TO_EXIT) {
              graph.newEdge(bot, dy * 50 + dx, infini)
            }
          }
        } else if (room2d[x][y] === RoomCellType.PROTECTED) {
          // protected Tile
          graph.newEdge(source, top, infini)
          graph.newEdge(top, bot, 1)
          for (let i = 0; i < 8; i++) {
            const dx = x + surr[i][0]
            const dy = y + surr[i][1]
            if (room2d[dx][dy] === RoomCellType.NORMAL || room2d[dx][dy] === RoomCellType.TO_EXIT) {
              graph.newEdge(bot, dy * 50 + dx, infini)
            }
          }
        } else if (room2d[x][y] === RoomCellType.TO_EXIT) {
          // near Exit
          graph.newEdge(top, sink, infini)
        }
      }
    } // graph finished

    return graph
  }

  private static deleteTilesToDeadEnds(roomName: string, cut_tiles_array: Coordinates[]) {
    // Removes unneccary cut-tiles if bounds are set to include some 	dead ends
    // Get Terrain and set all cut-tiles as unwalkable
    const room_array = MinCut.getRoom2D(roomName)

    for (let i = cut_tiles_array.length - 1; i >= 0; i--) {
      room_array[cut_tiles_array[i].x][cut_tiles_array[i].y] = RoomCellType.UNWALKABLE
    }

    // Floodfill from exits: save exit tiles in array and do a bfs-like search
    const unvisited_pos: number[] = []

    for (let y = 0; y < 49; y++) {
      if (room_array[1][y] === RoomCellType.TO_EXIT) {
        unvisited_pos.push(50 * y + 1)
      }

      if (room_array[48][y] === RoomCellType.TO_EXIT) {
        unvisited_pos.push(50 * y + 48)
      }
    }

    for (let x = 0; x < 49; x++) {
      if (room_array[x][1] === RoomCellType.TO_EXIT) {
        unvisited_pos.push(50 + x)
      }

      if (room_array[x][48] === RoomCellType.TO_EXIT) {
        unvisited_pos.push(2400 + x) // 50*48=2400
      }
    }

    // Iterate over all unvisited RoomCell.TO_EXIT- Tiles and mark neigbours as RoomCell.TO_EXIT tiles, if walkable (RoomCell.NORMAL), and add to unvisited
    while (unvisited_pos.length > 0) {
      const index: number = unvisited_pos.pop() as number
      const x: number = index % 50
      const y: number = Math.floor(index / 50)

      for (let i = 0; i < 8; i++) {
        const dx: number = x + surr[i][0]
        const dy: number = y + surr[i][1]

        if (room_array[dx][dy] === RoomCellType.NORMAL) {
          unvisited_pos.push(50 * dy + dx)
          room_array[dx][dy] = RoomCellType.TO_EXIT
        }
      }
    }

    // Remove min-Cut-Tile if there is no TO-EXIT  surrounding it
    let leads_to_exit: boolean = false

    for (let i = cut_tiles_array.length - 1; i >= 0; i--) {
      leads_to_exit = false

      const x: number = cut_tiles_array[i].x
      const y: number = cut_tiles_array[i].y

      for (let i = 0; i < 8; i++) {
        const dx: number = x + surr[i][0]
        const dy: number = y + surr[i][1]

        if (room_array[dx][dy] === RoomCellType.TO_EXIT) {
          leads_to_exit = true
        }
      }

      if (!leads_to_exit) {
        cut_tiles_array.splice(i, 1)
      }
    }
  }

  public static GetCutTiles(
    roomName: string,
    protectedArea: RectCoordinates[],
    bounds: RectCoordinates = { x1: 0, y1: 0, x2: 49, y2: 49 }
  ): Coordinates[] {
    const graph = MinCut.createGraph(roomName, protectedArea, bounds)
    const source = 2 * 50 * 50 // Position Source / Sink in Room-Graph
    const sink = 2 * 50 * 50 + 1
    const count = graph.getMinCut(source, sink)

    const positions: Coordinates[] = []

    if (count > 0) {
      const cutEdges = graph.BFSTheCut(source)

      for (const edge of cutEdges) {
        const x = edge % 50
        const y = Math.floor(edge / 50)
        positions.push({ x, y })
      }
    }

    // if bounds are given,
    // try to dectect islands of walkable tiles, which are not conntected to the exits, and delete them from the cut-tiles
    const wholeRoom = bounds.x1 === 0 && bounds.y1 === 0 && bounds.x2 === 49 && bounds.y2 === 49

    if (positions.length > 0 && !wholeRoom) {
      MinCut.deleteTilesToDeadEnds(roomName, positions)
    }

    // Visualise Result
    if (positions.length > 0) {
      const visual = new RoomVisual(roomName)

      for (let i = positions.length - 1; i >= 0; i--) {
        visual.circle(positions[i].x, positions[i].y, {
          fill: '#ff7722',
          opacity: 0.9,
          radius: 0.5
        })
      }
    }

    return positions
  }

  private static getRoom2D(roomName: string, bounds: RectCoordinates = { x1: 0, y1: 0, x2: 49, y2: 49 }): Room2D {
    // Array for room tiles
    const room2d: Room2D = Array(ROOM_SIZE)
      .fill(RoomCellType.NORMAL)
      .map(_ => Array(ROOM_SIZE).fill(RoomCellType.UNWALKABLE))

    for (let i = bounds.x1; i <= bounds.x2; i++) {
      for (let j = bounds.y1; j <= bounds.x2; j++) {
        if (Game.map.getTerrainAt(i, j, roomName) !== 'wall') {
          room2d[i][j] = RoomCellType.NORMAL // mark unwalkable

          if (i === bounds.x1 || j === bounds.y1 || i === bounds.x2 || j === bounds.y2) {
            room2d[i][j] = RoomCellType.TO_EXIT // Sink Tiles mark from given bounds
          }

          if (i === 0 || j === 0 || i === 49 || j === 49) {
            room2d[i][j] = RoomCellType.EXIT // Exit Tiles mark
          }
        }
      }
    }

    // Marks tiles Near Exits for sink- where you cannot build wall/rampart

    for (let y = 1; y < 49; y++) {
      if (room2d[0][y - 1] === RoomCellType.EXIT) {
        room2d[1][y] = RoomCellType.TO_EXIT
      }
      if (room2d[0][y] === RoomCellType.EXIT) {
        room2d[1][y] = RoomCellType.TO_EXIT
      }
      if (room2d[0][y + 1] === RoomCellType.EXIT) {
        room2d[1][y] = RoomCellType.TO_EXIT
      }
      if (room2d[49][y - 1] === RoomCellType.EXIT) {
        room2d[48][y] = RoomCellType.TO_EXIT
      }
      if (room2d[49][y] === RoomCellType.EXIT) {
        room2d[48][y] = RoomCellType.TO_EXIT
      }
      if (room2d[49][y + 1] === RoomCellType.EXIT) {
        room2d[48][y] = RoomCellType.TO_EXIT
      }
    }

    for (let x = 1; x < 49; x++) {
      if (room2d[x - 1][0] === RoomCellType.EXIT) {
        room2d[x][1] = RoomCellType.TO_EXIT
      }
      if (room2d[x][0] === RoomCellType.EXIT) {
        room2d[x][1] = RoomCellType.TO_EXIT
      }
      if (room2d[x + 1][0] === RoomCellType.EXIT) {
        room2d[x][1] = RoomCellType.TO_EXIT
      }
      if (room2d[x - 1][49] === RoomCellType.EXIT) {
        room2d[x][48] = RoomCellType.TO_EXIT
      }
      if (room2d[x][49] === RoomCellType.EXIT) {
        room2d[x][48] = RoomCellType.TO_EXIT
      }
      if (room2d[x + 1][49] === RoomCellType.EXIT) {
        room2d[x][48] = RoomCellType.TO_EXIT
      }
    }

    // mark Border Tiles as not usable
    for (let y = 1; y < 49; y++) {
      room2d[0][y] === RoomCellType.UNWALKABLE
      room2d[49][y] === RoomCellType.UNWALKABLE
    }

    for (let x = 1; x < 49; x++) {
      room2d[x][0] === RoomCellType.UNWALKABLE
      room2d[x][49] === RoomCellType.UNWALKABLE
    }

    return room2d
  }
}

export function loop() {
  if (Game.time % 10 !== 0) {
    const startCPU: number = Game.cpu.getUsed()

    // Rectangle Array, the Rectangles will be protected by the returned tiles
    const protectedArea: RectCoordinates[] = [{ x1: 20, y1: 6, x2: 28, y2: 27 }, { x1: 29, y1: 13, x2: 34, y2: 16 }]

    // Boundary Array for Maximum Range
    const bounds: RectCoordinates = { x1: 0, y1: 0, x2: 49, y2: 49 }

    const positions: Coordinates[] = MinCut.GetCutTiles('sim', protectedArea, bounds)

    console.log(`Positions returned: ${positions.length}`)
    console.log(`Needed ${Game.cpu.getUsed() - startCPU} cpu time`)
  }
}
