import { Action, ActionRegistry } from "../../../engine"
import { GetEnergyFromStorageCreepAction } from "../get-energy"
import { TravelToCreepAction } from "../travel"
import { UpgradeControllerCreepAction } from "../upgrade-controller"

@ActionRegistry.register
export class BuilderCreepAction extends Action {
    run(creep: Creep) {
        if (creep.carry.energy === 0) {
            return this.unshiftAndContinue(GetEnergyFromStorageCreepAction.name)
        }

        // search for construction site
        const construction: ConstructionSite = creep.getTarget(FIND_CONSTRUCTION_SITES, {
            prop: "construction"
        }) as ConstructionSite

        // TODO: if nothing to construct, recycle creep.
        if (construction == null) {
            // return this.shiftUnshitAndContinue(RecycleCreepAction.name)
            return this.shiftUnshitAndContinue(UpgradeControllerCreepAction.name)
        }

        const result = creep.build(construction)

        // move to the target or invalidate the target
        if (result === ERR_NOT_IN_RANGE) {
            creep.memory.travelTo = creep.memory.construction

            return this.unshiftAndContinue(TravelToCreepAction.name)
        }

        if (result === ERR_INVALID_TARGET) {
            delete creep.memory.construction
        }

        return this.shiftAndStop()
    }
}
