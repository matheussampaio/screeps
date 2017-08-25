'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

class ProcessRegistry {
    static register(constructor) {
        ProcessRegistry.registry[constructor.name] = constructor;
    }
    static fetch(processName) {
        return ProcessRegistry.registry[processName];
    }
}
ProcessRegistry.registry = {};

function registerProcess(constructor) {
    ProcessRegistry.register(constructor);
}

var ProcessPriority;
(function (ProcessPriority) {
    ProcessPriority[ProcessPriority["High"] = 1] = "High";
    ProcessPriority[ProcessPriority["Normal"] = 2] = "Normal";
    ProcessPriority[ProcessPriority["Low"] = 3] = "Low";
})(ProcessPriority || (ProcessPriority = {}));
var ProcessStatus;
(function (ProcessStatus) {
    ProcessStatus[ProcessStatus["Dead"] = 0] = "Dead";
    ProcessStatus[ProcessStatus["Alive"] = 1] = "Alive";
})(ProcessStatus || (ProcessStatus = {}));
class Process {
    static fork(...args) {
        return new this(...args).pid;
    }
    constructor(parentPID, { memory = {}, pid = -1, priority = ProcessPriority.Normal } = {}) {
        this.priority = priority;
        this.status = ProcessStatus.Alive;
        this.pid = pid !== -1 ? pid : Kernel.getNextPID();
        if (parentPID === -1) {
            throw new Error('missing parentPID');
        }
        this.parentPID = parentPID;
        this.memory = _.merge(Kernel.getProcessMemory(this.pid), memory);
        this.memory.children = this.memory.children || {};
        this.memory.processName = this.memory.processName || this.constructor.name;
        Kernel.addProcess(this);
    }
    setMemory(memory) {
        this.memory = memory;
    }
    stop() {
        Kernel.killProcess(this.pid);
        const parent = Kernel.getProcessByPID(this.parentPID);
        if (parent != null && parent.notifyStop) {
            parent.notifyStop(this.pid);
        }
    }
    notifyStop(pid) {
        this.memory.children = this.memory.children || {};
        _.keys(this.memory.children, (key) => {
            if (this.memory.children[key][pid]) {
                delete this.memory.children[key][pid];
            }
        });
    }
    cleanChildren() {
        _.forIn(this.memory.children, (value, key) => {
            if (_.isNumber(value) && Kernel.getProcessByPID(value) == null) {
                delete this.memory.children[key];
            }
            else if (_.isArray(value)) {
                this.memory.children[key] = value.filter((pid) => Kernel.getProcessByPID(pid) != null);
            }
            else {
                _.forIn(value, (__, pid) => {
                    if (Kernel.getProcessByPID(parseInt(pid, 10)) == null) {
                        delete value[pid];
                    }
                });
            }
        });
    }
    serialize() {
        return [this.pid, this.parentPID, this.constructor.name, this.priority];
    }
}

var ProcessPriority$1;
(function (ProcessPriority) {
    ProcessPriority[ProcessPriority["High"] = 1] = "High";
    ProcessPriority[ProcessPriority["Normal"] = 2] = "Normal";
    ProcessPriority[ProcessPriority["Low"] = 3] = "Low";
})(ProcessPriority$1 || (ProcessPriority$1 = {}));
var ProcessStatus$1;
(function (ProcessStatus) {
    ProcessStatus[ProcessStatus["Dead"] = 0] = "Dead";
    ProcessStatus[ProcessStatus["Alive"] = 1] = "Alive";
})(ProcessStatus$1 || (ProcessStatus$1 = {}));
class Process$1 {
    static fork(...args) {
        return new this(...args).pid;
    }
    constructor(parentPID, { memory = {}, pid = -1, priority = ProcessPriority$1.Normal } = {}) {
        this.priority = priority;
        this.status = ProcessStatus$1.Alive;
        this.pid = pid !== -1 ? pid : Kernel.getNextPID();
        if (parentPID === -1) {
            throw new Error('missing parentPID');
        }
        this.parentPID = parentPID;
        this.memory = _.merge(Kernel.getProcessMemory(this.pid), memory);
        this.memory.children = this.memory.children || {};
        this.memory.processName = this.memory.processName || this.constructor.name;
        Kernel.addProcess(this);
    }
    setMemory(memory) {
        this.memory = memory;
    }
    stop() {
        Kernel.killProcess(this.pid);
        const parent = Kernel.getProcessByPID(this.parentPID);
        if (parent != null && parent.notifyStop) {
            parent.notifyStop(this.pid);
        }
    }
    notifyStop(pid) {
        this.memory.children = this.memory.children || {};
        _.keys(this.memory.children, (key) => {
            if (this.memory.children[key][pid]) {
                delete this.memory.children[key][pid];
            }
        });
    }
    cleanChildren() {
        _.forIn(this.memory.children, (value, key) => {
            if (_.isNumber(value) && Kernel.getProcessByPID(value) == null) {
                delete this.memory.children[key];
            }
            else if (_.isArray(value)) {
                this.memory.children[key] = value.filter((pid) => Kernel.getProcessByPID(pid) != null);
            }
            else {
                _.forIn(value, (__, pid) => {
                    if (Kernel.getProcessByPID(parseInt(pid, 10)) == null) {
                        delete value[pid];
                    }
                });
            }
        });
    }
    serialize() {
        return [this.pid, this.parentPID, this.constructor.name, this.priority];
    }
}

let SHUCreep = SHUCreep_1 = class SHUCreep extends Process$1 {
    static touch() {
    }
    static start({ parentPID, memory }) {
        const proc = new SHUCreep_1(parentPID, { memory });
        Kernel.addProcess(proc);
        return proc.pid;
    }
    run() {
        this.creep = Game.creeps[this.memory.creepName];
        this.room = Game.rooms[this.memory.roomName];
        this.spawn = _.find(Game.spawns, (s) => s.energy < s.energyCapacity && s.room.name === this.room.name);
        if (this.room == null || this.creep == null) {
            return Kernel.killProcess(this.pid);
        }
        this.memory.mission = this.memory.mission || 'energy';
        if (this.memory.mission === 'energy') {
            if (this.creep.carry.energy < this.creep.carryCapacity) {
                this.getEnergy();
            }
            else {
                this.memory.mission = 'transfer';
            }
        }
        else if (this.memory.mission === 'transfer') {
            if (this.spawn != null) {
                this.fillSpawn();
            }
            else {
                this.memory.mission = 'upgrade';
            }
        }
        else if (this.memory.mission === 'upgrade') {
            if (this.creep.carry.energy) {
                this.upgradeController();
            }
            else {
                this.memory.mission = 'energy';
            }
        }
    }
    getEnergy() {
        let target = Game.getObjectById(this.memory.target);
        if (target == null) {
            const sources = this.room.find(FIND_SOURCES_ACTIVE);
            if (sources.length) {
                this.memory.target = _.sample(sources).id;
            }
            target = Game.getObjectById(this.memory.target);
        }
        if (target != null) {
            const codeHarvest = this.creep.harvest(target);
            if (codeHarvest === ERR_NOT_IN_RANGE && this.creep.fatigue === 0) {
                const codeMove = this.creep.moveTo(target);
                if (codeMove !== OK) {
                    this.memory.target = null;
                }
            }
        }
    }
    fillSpawn() {
        const codeTransfer = this.creep.transfer(this.spawn, RESOURCE_ENERGY);
        if (codeTransfer === OK) {
            this.memory.mission = 'energy';
        }
        else if (codeTransfer === ERR_NOT_IN_RANGE) {
            const codeMove = this.creep.moveTo(this.spawn);
        }
    }
    upgradeController() {
        if (this.creep.upgradeController(this.room.controller) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(this.room.controller);
        }
    }
};
SHUCreep = SHUCreep_1 = __decorate([
    registerProcess
], SHUCreep);
var SHUCreep_1;

let SpawnProcess = class SpawnProcess extends Process {
    run() {
        this.memory.request = this.memory.request || [];
        if (this.memory.request.length === 0) {
            return;
        }
        const req = this.memory.request[0];
        const spawns = _.filter(Game.spawns, (s) => {
            return s.room.name === this.memory.roomName && s.spawning == null && s.isActive();
        });
        if (spawns.length === 0) {
            return;
        }
        const spawn = spawns[0];
        const ProcessCreep = ProcessRegistry.fetch(req.process);
        if (ProcessCreep == null) {
            console.log('cant find process', req.process);
            return;
        }
        const ParentProcess = Kernel.getProcessByPID(req.parentPID);
        if (ParentProcess == null) {
            this.memory.request.shift();
            return console.log('Parent process died');
        }
        else if (ParentProcess.receiveCreep == null) {
            return console.log('Process cant receive creeps, please, implement receiveCreep');
        }
        if (spawn.canCreateCreep(req.body) !== OK) {
            return;
        }
        const creepName = spawn.createCreep(req.body);
        if (_.isString(creepName)) {
            this.memory.request.shift();
            req.memory.creepName = creepName;
            const pid = ProcessCreep.start({
                memory: req.memory,
                parentPID: req.parentPID
            });
            ParentProcess.receiveCreep(pid, creepName, req.process);
        }
        else {
            console.log('error creating creep', creepName);
        }
    }
    add(request) {
        this.memory.request = this.memory.request = [];
        const result = _.find(this.memory.request, (r) => {
            return r.process === request.process && r.parentPID === request.parentPID;
        });
        if (result == null) {
            this.memory.request.push(request);
        }
    }
};
SpawnProcess = __decorate([
    registerProcess
], SpawnProcess);

SHUCreep.touch();
let RCLProgram = class RCLProgram extends Process {
    run() {
        if (!this.checkIfRoomIsOK()) {
            console.log('stop beacuse room is not ok');
            this.stop();
            return false;
        }
        this.cleanChildren();
        this.spawn = this.getOrForkSpawn();
        return true;
    }
    checkIfRoomIsOK() {
        const room = Game.rooms[this.memory.roomName];
        return room != null && room.controller.level === this.level;
    }
    getCreepsNumber() {
        this.memory.children.creeps = this.memory.children.creeps || (this.memory.children.creeps = {});
        return Object.keys(this.memory.children.creeps).length;
    }
    getOrForkSpawn() {
        if (this.memory.children.spawn == null || Kernel.processTable[this.memory.children.spawn] == null) {
            this.memory.children.spawn = SpawnProcess.fork(this.pid, { memory: { roomName: this.memory.roomName } });
        }
        return Kernel.getProcessByPID(this.memory.children.spawn);
    }
};
RCLProgram = __decorate([
    registerProcess
], RCLProgram);

SHUCreep.touch();
let RCL1Program = class RCL1Program extends RCLProgram {
    get level() {
        return 1;
    }
    static toString() {
        return 'process.RCL1Program';
    }
    run() {
        if (!super.run()) {
            return false;
        }
        if (this.getCreepsNumber() < 10) {
            this.spawn.add({
                body: [MOVE, WORK, MOVE, CARRY],
                memory: { roomName: this.memory.roomName },
                parentPID: this.pid,
                process: 'SHUCreep'
            });
        }
        return true;
    }
    receiveCreep(pid, creepName, processName) {
        this.memory.children.creeps[pid] = { creepName, processName };
    }
};
RCL1Program = __decorate([
    registerProcess
], RCL1Program);

SHUCreep.touch();
let RCL2Program = class RCL2Program extends RCLProgram {
    get level() {
        return 2;
    }
    static toString() {
        return 'process.RCL2Program';
    }
    run() {
        if (!super.run()) {
            return false;
        }
        if (this.getCreepsNumber() < 10) {
            this.spawn.add({
                body: [MOVE, WORK, MOVE, CARRY],
                memory: { roomName: this.memory.roomName },
                parentPID: this.pid,
                process: 'SHUCreep'
            });
        }
        return true;
    }
    receiveCreep(pid, creepName, processName) {
        this.memory.children.creeps[pid] = { creepName, processName };
    }
};
RCL2Program = __decorate([
    registerProcess
], RCL2Program);

let InitProcess = class InitProcess extends Process {
    run() {
        this.memory.children.rooms = this.memory.children.rooms || {};
        for (const roomName in this.memory.children.rooms) {
            if (Game.rooms[roomName] == null) {
                this.memory.children.rooms[roomName] = null;
            }
        }
        for (const roomName in Game.rooms) {
            const pid = this.memory.children.rooms[roomName];
            if (pid == null || Kernel.processTable[pid] == null) {
                const room = Game.rooms[roomName];
                const programs = {
                    1: RCL1Program,
                    2: RCL2Program,
                    default: RCL2Program
                };
                const Program = programs[room.controller.level] || programs.default;
                this.memory.children.rooms[roomName] = Program.fork(this.pid, { memory: { roomName } });
            }
        }
    }
};
InitProcess = __decorate([
    registerProcess
], InitProcess);

class Kernel {
    static load() {
        this.loadProcessTable();
        this.garbageCollection();
        if (this.getProcessByPID(0) == null) {
            InitProcess.fork(0, { pid: 0, priority: ProcessPriority$1.High });
        }
    }
    static run() {
        while (this.queue.length) {
            let process = this.queue.pop();
            while (process) {
                if (this.getProcessByPID(process.parentPID) == null) {
                    this.killProcess(process.pid);
                }
                if (process.status === ProcessStatus$1.Alive) {
                    try {
                        const cpu = Game.cpu.getUsed();
                        process.run();
                        console.log(`${process.constructor.name}: + ${(Game.cpu.getUsed() - cpu).toFixed(3)}`);
                    }
                    catch (error) {
                        console.log(error);
                        process.stop();
                    }
                }
                process = this.queue.pop();
            }
        }
    }
    static save() {
        this.storeProcessTable();
    }
    static addProcess(process) {
        this.processTable[process.pid] = process;
        this.storeProcessTable();
    }
    static getProcessByPID(pid) {
        return this.processTable[pid];
    }
    static getNextPID() {
        Memory.pidCounter = Memory.pidCounter || 0;
        while (this.getProcessByPID(Memory.pidCounter)) {
            if (Memory.pidCounter >= Number.MAX_SAFE_INTEGER) {
                Memory.pidCounter = 0;
            }
            Memory.pidCounter++;
        }
        return Memory.pidCounter;
    }
    static getProcessMemory(pid) {
        Memory.processMemory = Memory.processMemory || {};
        Memory.processMemory[pid] = Memory.processMemory[pid] || {};
        return Memory.processMemory[pid];
    }
    static storeProcessTable() {
        Memory.processTable = _.filter(this.processTable, (p) => p.status !== ProcessStatus$1.Dead)
            .map((p) => [p.pid, p.parentPID, p.constructor.name, p.priority]);
    }
    static killProcess(pid) {
        for (const otherPid in this.processTable) {
            const process = this.processTable[otherPid];
            if (process.parentPID === pid && process.status !== ProcessStatus$1.Dead) {
                this.killProcess(process.pid);
            }
        }
        this.processTable[pid].status = ProcessStatus$1.Dead;
        Memory.processMemory[pid] = null;
    }
    static garbageCollection() {
        Memory.processMemory = _.pick(Memory.processMemory, (_, k) => this.processTable[k] != null);
        Memory.creeps = _.pick(Memory.creeps, (_, k) => Game.creeps[k] != null);
        Memory.rooms = _.pick(Memory.rooms, (_, k) => Game.rooms[k] != null);
    }
    static loadProcessTable() {
        this.processTable = {};
        this.queue = [];
        Memory.processTable = Memory.processTable || [];
        for (const [pid, parentPID, processName, priority] of Memory.processTable) {
            const ProcessClass = ProcessRegistry.fetch(processName);
            if (ProcessClass == null) {
                continue;
            }
            const process = new ProcessClass(parentPID, { pid, priority });
            this.processTable[pid] = process;
            this.queue.push(process);
        }
    }
}
Kernel.processTable = {};
Kernel.queue = [];

class Stats {
    static collect() {
        Memory.stats = { cpu: {}, gcl: {}, memory: {}, rooms: {}, time: Game.time, totalCreepCount: _.size(Game.creeps) };
        for (const roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            const isMyRoom = (room.controller ? room.controller.my : false);
            if (isMyRoom) {
                const roomStats = Memory.stats.rooms[roomName] = {};
                roomStats.storageEnergy = (room.storage ? room.storage.store.energy : 0);
                roomStats.terminalEnergy = (room.terminal ? room.terminal.store.energy : 0);
                roomStats.energyAvailable = room.energyAvailable;
                roomStats.energyCapacityAvailable = room.energyCapacityAvailable;
                roomStats.controllerProgress = room.controller.progress;
                roomStats.controllerProgressTotal = room.controller.progressTotal;
                roomStats.controllerLevel = room.controller.level;
            }
        }
        Memory.stats.gcl.progress = Game.gcl.progress;
        Memory.stats.gcl.progressTotal = Game.gcl.progressTotal;
        Memory.stats.gcl.level = Game.gcl.level;
        Memory.stats.memory.used = RawMemory.get().length;
        Memory.stats.cpu.bucket = Game.cpu.bucket;
        Memory.stats.cpu.limit = Game.cpu.limit;
        Memory.stats.cpu.used = Game.cpu.getUsed();
        Memory.avg = Memory.avg || [];
        Memory.avg.push({
            cpu: Memory.stats.cpu.used,
            ram: Memory.stats.memory.used
        });
        if (Memory.avg.length >= 50) {
            console.log(Stats.summary());
            Memory.avg = [];
        }
    }
    static summary() {
        const avgCPU = _.ceil(_.sum(Memory.avg, 'cpu') / Memory.avg.length, 2);
        const avgRAM = _.ceil(_.sum(Memory.avg, 'ram') / Memory.avg.length / 1024, 2);
        return `TIME=[${Game.time}] CPU=[${avgCPU}/${Memory.stats.cpu.limit}] RAM=[${avgRAM}KB/2048KB]`;
    }
}

function loop() {
    Kernel.load();
    Kernel.run();
    Kernel.save();
    Stats.collect();
}

exports.loop = loop;
