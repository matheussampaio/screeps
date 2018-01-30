import { CreepInstall } from './creep'
import { RoomInstall } from './room'
import { StructureInstall } from './structure'

export function install() {
    CreepInstall()
    RoomInstall()
    StructureInstall()
}
