import { MinCut, RectCoordinates, Coordinates } from './min-cut'

export function loop() {
  if (Game.time % 10 !== 0) {
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
}
