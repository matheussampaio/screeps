import { RoomRole, RoomRoleRegistry } from "../../engine"
import {
    CityControlRoomAction,
    CreateBuildersRoomAction,
    ControlTowerRoomAction,
    CreateHarvestersRoomAction,
    CreateUpgradersRoomAction,
    RoomPlannerRoomAction,
    SpawnCreepRoomAction
} from "../../room-actions"

@RoomRoleRegistry.register
export class CityRoomRole extends RoomRole {
    defaults(): string[][] {
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
