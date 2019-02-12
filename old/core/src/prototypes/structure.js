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
