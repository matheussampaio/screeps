import * as _ from 'lodash'

export function getEmptySpacesAroundPosition(pos: RoomPosition, { range = 1, closeToExits = true }: { range?: number, closeToExits?: boolean } = {}): RoomPosition[] {

  const positions = getNeighborsPositions(pos, { range, closeToExits })

  const terrain: RoomTerrain = new Room.Terrain(pos.roomName)

  const TERRAIN_MASK_PLAIN = 0

  return positions.filter(p => terrain.get(p.x, p.y) === TERRAIN_MASK_SWAMP || terrain.get(p.x, p.y) === TERRAIN_MASK_PLAIN)
}

export function getNeighborsPositions(pos: RoomPosition, { range = 1, closeToExits = true }: { range?: number, closeToExits?: boolean } = {}): RoomPosition[] {
  const coords = getNeighborsCoords(pos.x, pos.y, range)

  const room: Room = Game.rooms[pos.roomName]

  const positions = coords
    .map(coord => room.getPositionAt(coord.x, coord.y))
    .filter(p => p != null) as RoomPosition[]

  if (closeToExits) {
    return positions
  }

  return positions.filter(pos => !isPositionCloseToExit(pos))
}

export function isExitPosition(pos: RoomPosition | { x: number, y: number }): boolean {
  return pos.x === 0 || pos.y === 0 || pos.x === 49 || pos.y === 49
}

export function isPositionCloseToExit(pos: RoomPosition | { x: number, y: number }): boolean {
  if (isExitPosition(pos)) {
    return true
  }

  // if pos is not close to the borders (i.e., in the center of the room), its not close to exit
  if (pos.x > 1 && pos.y > 1 && pos.x < 48 && pos.y < 48) {
    return false
  }

  const neighbors = getNeighborsCoords(pos.x, pos.y, 1)

  return neighbors.some(p => isExitPosition(p))
}

export function getNeighborsCoords(x: number, y: number, range: number = 1): { x: number, y: number}[] {
  const coords = []

  for (let dx = -range; dx <= range; dx++) {
    coords.push({ x: x + dx, y: y + range })
    coords.push({ x: x + dx, y: y - range })
  }

  for (let dy = -range + 1; dy < range; dy++) {
    coords.push({ x: x + range, y: y + dy })
    coords.push({ x: x - range, y: y + dy })
  }

  return coords.sort((c1, c2) => c1.y !== c2.y ? c1.y - c2.y : c1.x - c2.x)
}

export function getActiveBodyPartsFromCreep(creeps: Creep | Creep[], part: BodyPartConstant): number {
  const creepsArr: Creep[] = _.isArray(creeps) ? creeps : [creeps]

  const activeParts: number[] = creepsArr.map(creep => creep.getActiveBodyparts(part))

  return _.sum(activeParts)
}

export function getActiveBodyPartsFromName(names: string | string[], part: BodyPartConstant): number {
  const creeps: Creep[] = getCreepsFromName(names)

  return getActiveBodyPartsFromCreep(creeps, part)
}

export function getCreepsCostByName(names: string | string[]): number {
  const creeps: Creep[] = getCreepsFromName(names)

  return getCreepsCost(creeps)
}

export function getCreepsCost(creeps: Creep[]): number {
  let sum = 0

  for (const creep of creeps) {
    for (const part of creep.body) {
      sum += BODYPART_COST[part.type]
    }
  }

  return sum
}

export function getCreepsFromName(names: string | string[]): Creep[] {
  const namesArr = _.isString(names) ? [names] : names

  return namesArr
    .map(name => Game.creeps[name])
    .filter(creep => creep != null)
}

export function getFreeCapacity(
  unit: Creep | StructureSpawn | StructureTower | StructureExtension | StructureStorage,
  resourceType: ResourceConstant = RESOURCE_ENERGY
): number {
  return unit.store.getFreeCapacity(resourceType) || 0
}
