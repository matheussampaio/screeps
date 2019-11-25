import { PRIORITY } from '../core'

export const CREEP_PRIORITY = {
  EMERGENCY: PRIORITY.VERY_HIGH,

  STORAGER: PRIORITY.HIGH_2,
  LINKER: PRIORITY.HIGH_1,

  HAULER: PRIORITY.NORMAL_4,
  HARVESTER: PRIORITY.NORMAL_3,
  UPGRADER: PRIORITY.NORMAL_2,
  BUILDER: PRIORITY.NORMAL_1,

  REMOTE_GUARD: PRIORITY.LOW_4,
  REMOTE_RESERVER: PRIORITY.LOW_3,
  REMOTE_HARVESTER: PRIORITY.LOW_2,
  REMOTE_HAULER: PRIORITY.LOW_1,

  REMOTE_SCOUT: PRIORITY.VERY_LOW,
  RECYCLER: PRIORITY.VERY_LOW,
  HAULER_MINERAL: PRIORITY.VERY_LOW_4,
  HARVESTER_MINERAL: PRIORITY.VERY_LOW_4,
  REPAIR_MINERAL: PRIORITY.VERY_LOW_3
}