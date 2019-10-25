export function getUniqueCreepName(prefix: string = 'creep'): string {
  const counters = Memory.counters || (Memory.counters = {})

  if (counters.creepCounter == null) {
    counters.creepCounter = 1
  }

  while (Game.creeps[`${prefix}-${counters.creepCounter}`]) {
    counters.creepCounter++

    if (counters.creepCounter >= Number.MAX_SAFE_INTEGER) {
      counters.creepCounter = 1
    }
  }

  return `${prefix}-${counters.creepCounter}`
}

