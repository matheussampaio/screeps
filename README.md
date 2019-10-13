Screeps Code
============

This repository contains the code to my AI for playing [Screeps](https://screeps.com)

## Requirements
- Node.js

## How to install
```
$ npm install
```

## Environemnt Variables
Create a `.env` file from `.env.example` and fill all the details.

## How to compile your code
```
$ npm run build
```

## How to upload code to Screeps
```
$ npm run upload
```

## Build & Upload on file changes
```
$ npm run dev
```

## To Do List
[ ] - Tower
  [ ] - Attack enemy creeps
  [ ] - Maintain rampart, road, wall
[ ] - After 700 energy capacity (8 extensions + 1 Spawn), switch to role based creeps
  [ ] - Create one harvester per source
  [ ] - Create one courier per source
  [ ] - Create one upgrader (with container)
  [x] - Spawn a Builder whenever something is in the queue to be build
[ ] - LVL 5, build one line close to Storage
[ ] - LVL 5, build one link close to the fatherst Source
[ ] - LVL 6, build one link close to the closest Source
[ ] - LVL 7, build one link close to the Controller
[ ] - Create CityPlanner action to queue structures to be build (i.e. extensions, containers, roads, walls, ramparts)
[ ] - Extract room from neighbors
  [ ] - Scout North, East, South, and West rooms and register Sources (and distance to Spawn)
  [ ] - Reserve rooms to increase Source's max energy
[ ] - After roads are in place, spawn creeps with less MOVE parts.
[ ] - fix: Multiples Sleep in the same process will cause conflicts with `context.wakeAt`

