declare global {
    interface StructureSpawn {
        isFull(): boolean
    }

    interface StructureExtension {
        isFull(): boolean
    }

    interface StructureTower {
        isFull(): boolean
    }

    interface StructureStorage {
        isFull(): boolean
    }

    interface StructureContainer {
        isFull(): boolean
    }

    interface StructureTerminal {
        isFull(): boolean
    }
}

export function installStructurePrototype() {
    StructureSpawn.prototype.isFull = function isFull() {
        return this.energy === this.energyCapacity
    }

    StructureExtension.prototype.isFull = function isFull() {
        return this.energy === this.energyCapacity
    }

    StructureTower.prototype.isFull = function isFull() {
        return this.energy === this.energyCapacity
    }

    StructureStorage.prototype.isFull = function isFull() {
        return _.sum(this.store) === this.storeCapacity
    }

    StructureContainer.prototype.isFull = function isFull() {
        return _.sum(this.store) === this.storeCapacity
    }

    StructureTerminal.prototype.isFull = function isFull() {
        return _.sum(this.store) === this.storeCapacity
    }
}
