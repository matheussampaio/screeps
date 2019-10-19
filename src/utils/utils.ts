import * as _ from 'lodash'

export function getEmptySpacesAroundPosition(pos: RoomPosition): number {
  const positions = getNeighborsPositions(pos)

  const terrain: RoomTerrain = new Room.Terrain(pos.roomName)

  const TERRAIN_MASK_PLAIN = 0

  return positions.map(p => terrain.get(p.x, p.y))
    .filter(t => t === TERRAIN_MASK_SWAMP || t === TERRAIN_MASK_PLAIN)
    .length
}

export function getNeighborsPositions(pos: RoomPosition): RoomPosition[] {
  const cords: [number, number][] = [
    [-1, -1], [0, -1], [1, -1],
    [-1,  0],          [1,  0],
    [-1,  1], [0,  1], [1,  1]
  ]

  const room: Room = Game.rooms[pos.roomName]

  const positions = cords
    .map(([dx, dy]) => ([pos.x - dx, pos.y - dy]))
    .map(([x, y]) => room.getPositionAt(x, y))
    .filter(p => p != null) as RoomPosition[]

  return positions

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
