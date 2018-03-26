import { RoomRole, RoomRoleRegistry } from '@sae/core'
import {
    CityControlRoomAction,
    CreateBuildersRoomAction,
    ControlTowerRoomAction,
    CreateHarvestersRoomAction,
    CreateUpgradersRoomAction,
    RoomPlannerRoomAction,
    SpawnCreepRoomAction
} from '@sae/room-actions'

@RoomRoleRegistry.register
export class CityRoomRole extends RoomRole {
    defaults() {
        return [
            [CityControlRoomAction.name],
            [ControlTowerRoomAction.name],
            [CreateHarvestersRoomAction.name],
            [CreateUpgradersRoomAction.name],
            [CreateBuildersRoomAction.name],
            [SpawnCreepRoomAction.name],
            [RoomPlannerRoomAction.name]
        ]
    }
}
