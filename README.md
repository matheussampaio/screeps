MatheusSampaios' Screeps Code
=============================

# How to install
```bash
$ npm install
```

# How to compile
```bash
$ npm run build
```

# Develop
```bash
$ npm run debug
```

# Process

## InitProcess
```python
def run():
    # clean up process
    for process in process:
        if process is instance of RoomControlProcess and we lost this room:
            mark this process and all children as DEAD

    for room in Game.rooms:
        pid = this.memory.children.rooms[roomName]

        if pid is None or Kernel.processTable[pid] is None:
            create a RoomControlProcess for this

    return OK
```


## RoomControlProcess
```python
def run():
    if room.level >= 1:
        start SpawnerProcess if not running
        start StaticHarvesterProcess if not running
        start EnergyCourierProcess if not running
        start UpgraderProcess if not running

    if room.level >= 2:
        start BuilderProcess if not running

    if room.level >= 3:
        start RemoteHarvesterProcess if not running
        start TowerProcess if not running

    if room.level >= 4:
        start RepairerProcess if not running

    return OK
```


## SpawnerProcess
```python
def run():
    if we dont have request:
        return idle
    if we dont have free spawners:
        return idle for enough ticks
    if we don't have enough energy for the first request:
        return idle until we have energy

    resutlt = createCreep

    if result is string:
        get process with request.parentPID and call notifyCreep(creepName)

    return OK

def add(req):
    if is not repeated
        this.request.push(req)
        this.wakeUp()
```


## StaticHarvesterProcess
```python
def run():
    for source in room.sources:
        if we dont have a creep for this source:
            create creep (priority HIGH) with this source as target
        else still need more creeps:
            create creep (priority NORMAL) with this source as target

    for creep in room.creeps.harvester:
        if creep.memory.mission == MOVING_TO_SOURCE:
            # calculate path to energy
            creep.mMoveTo({ next: HARVESTER })

        if creep.memory.mission == HARVESTER:
            creep.harvester(creep.mission.target)

    return OK
```

## EnergyCourierProcess
```python
def run():
    for source in room.sources:
        if we dont have a creep for this source:
            create creep (priority HIGH) with this source as target
        else still need more creeps:
            create creep (priority NORMAL) with this source as target

    for creep in room.creeps.couriers:
        if creep.memory.mission == MOVING_TO_ENERGY:
            # calculate path to energy
            creep.mMoveTo({ next: WITHDRAW })

        if creep.memory.mission == WITHDRAW:
            creep.mWithdraw(creep.memory.energy, { next: MOVING_TO_CONTROLLER })

        if creep.memory.mission == MOVING_TO_TRANSFER:
            # calculate path to target
            creep.mMoveTo({ next: TRANSFER })

        if creep.memory.mission == TRANSFER:
            creep.mTransfer(creep.mission.target, { next: MOVING_TO_ENERGY })

            spawner.wakeUp()

    return OK
```

##  UpgraderProcess
```python
def run():
    if room.creeps.upgraders.length <= 2:
        create creeps upgrader with (priority NORMAL)

    for creep in room.creeps.upgraders:
        if creep.memory.mission == MOVING_TO_ENERGY:
            # calculate path to energy
            creep.mMoveTo({ next: WITHDRAW })

        if creep.memory.mission == WITHDRAW:
            creep.mWithdraw(creep.memory.energy, { next: MOVING_TO_CONTROLLER })

        if creep.memory.mission == MOVING_TO_CONTROLLER:
            # calculate path to controller
            creep.mMoveTo({ next: UPGRADE })

        if creep.memory.mission == UPGRADE:
            creep.mUpgradeController(room.controller, { next: MOVING_TO_ENERGY })

    return OK
```

## BuilderProcess
```python
def run():
    if this.memory.last != room.controller.level:
        this.memory.last = room.controller.level
        create extensions constructions units

    if this.memory.constructions.length === 0:
        for creep in room.creeps.builder:
            creep.suicide()

        this.idle(250)

        return OK

    if room.creeps.builder.length <= 5:
        create creeps builder with (priority NORMAL)

    for creep in room.creeps.builder:
        if creep.memory.mission == MOVING_TO_ENERGY:
            # calculate path to energy
            creep.mMoveTo({ next: WITHDRAW })

        elif creep.memory.mission == WITHDRAW:
            creep.mWithdraw(creep.memory.energy, { next: MOVING_TO_CONSTRUCTION })

        elif creep.memory.mission == MOVING_TO_CONSTRUCTION:
            # calculate path to construction
            creep.mMoveTo({ next: BUILD })

        elif creep.memory.mission == BUILD:
            creep.mBuild(creep.memory.target, { next: MOVING_TO_ENERGY })

    return OK
```

# Prototypes

## Creeps

### .mMove({ next })
```python
result = ERR_NO_PATH

if this.memory.path.length:
    step = this.memory.path[0]

    result = this.moveTo(step)

    if result == OK:
        this.memory.path.shift()
        this.memory.stuck = 0
    else:
        this.memory.stuck = this.memory.stuck + 1 || 1

if not this.memory.path.length:
    this.memory.mission = next

return result
```

### .mWithdraw(target, { next })
```python
result = this.withdraw(target)

if result == OK:
    this.memory.stuck = 0
elif result == ERR_FULL:
    this.memory.mission = next
else:
    this.memory.stuck = this.memory.stuck + 1 || 1

return result
```

### .mUpgradeController(target, { next })
```python
result = this.upgradeController(target)

if result == OK:
    this.memory.stuck = 0
elif result == ERR_NOT_ENOUGH_RESOURCES:
    this.memory.mission = next
else:
    this.memory.stuck = this.memory.stuck + 1 || 1

return result
```

### .mBuild(target, { next })
```python
result = this.build(target)

if result == OK:
    this.memory.stuck = 0
elif result == ERR_NOT_ENOUGH_RESOURCES:
    this.memory.mission = next
else:
    this.memory.stuck = this.memory.stuck + 1 || 1

return result
```

### .mTransfer(target, { next })
```python
result = this.transfer(target)

if result == OK:
    this.memory.stuck = 0
elif result == ERR_NOT_ENOUGH_RESOURCES:
    this.memory.mission = next
else:
    this.memory.stuck = this.memory.stuck + 1 || 1

return result
```

# Structures

## Kernel
 - InitProcess:
    - RoomControlProcess:
        - *+= level 1:*
            - SpawnerProcess
            - StaticHarvesterProcess
            - EnergyCourierProcess
            - UpgraderProcess
        - *+= level 2:*
            - BuilderProcess
                - ExtensionsBuilderProcess
                - RoadBuilderProcess
        - *+= level 3:*
            - RemoteHarvesterProcess
        - *+= level 4:*
            - RepairerProcess
