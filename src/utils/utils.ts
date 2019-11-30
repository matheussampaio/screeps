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

export function isExitPosition(pos: RoomPosition): boolean {
  if (pos.x > 0 && pos.y > 0 && pos.x < 49 && pos.y < 49) {
    return false
  }

  const room = Game.rooms[pos.roomName]

  // if we don't have vision of the room, everything in ther border is assumed
  // as an exit
  if (room == null) {
    return true
  }

  const terrain = room.getTerrain()

  return !(terrain.get(pos.x, pos.y) & TERRAIN_MASK_WALL)
}

export function isPositionCloseToExit(pos: RoomPosition): boolean {
  if (isExitPosition(pos)) {
    return true
  }

  // if pos is not close to the borders (i.e., in the center of the room), its not close to exit
  if (pos.x > 1 && pos.y > 1 && pos.x < 48 && pos.y < 48) {
    return false
  }

  const neighbors = getNeighborsPositions(pos)

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

export function isBodyEqual(b1: BodyPartConstant[], b2: BodyPartConstant[]): boolean {
  if (b1.length !== b2.length) {
    return false
  }

  for (let i = 0; i < b1.length; i++) {
    if (b1[i] !== b2[i]) {
      return false
    }
  }

  return true
}

export function getMaxEnemyAttackPower(enemies: Creep[]): number {
  return Math.max(...enemies.map(getEnemyAttackPower))
}

export function getEnemyAttackPower(enemy: Creep): number {
  return enemy.body.reduce((sum, part) => {
    if (!part.hits) {
      return sum
    }

    const bodyValue = getActualBodyValue(part)

    switch (part.type) {
      case ATTACK:
        return sum + bodyValue * ATTACK_POWER
      case RANGED_ATTACK:
        return sum + bodyValue * RANGED_ATTACK_POWER
      case HEAL:
        return sum + bodyValue * HEAL_POWER
    }

    return sum + 2
  }, 0)
}

export function getActualBodyValue(part: BodyPartDefinition): number {
  if (!part.boost) {
    return 1
  }

  const effects = BOOSTS[part.type as string][part.boost]

  const value = Object.values(effects)[0]

  // Boosted TOUGH parts absorb damage 30%/50%/70% and is stored as .7/.5/.3
  // respectively
  return part.type === TOUGH ? 1 / value : value
}
