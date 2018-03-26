import { installCreepPrototype } from './creep'
import { installRoomPrototype } from './room'
import { installStructurePrototype } from './structure'

export function installPrototypes() {
  installCreepPrototype()
  installRoomPrototype()
  installStructurePrototype()
}
