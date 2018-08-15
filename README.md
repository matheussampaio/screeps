Matheus Sampaios' Screeps Code
=============================

This is my code for the game [Screeps](https://screeps.com/).

```
src/
|---engine/
|   |---analytics/
|   |   |---stats.ts
|   |---core/
|   |   |---action-runner.ts
|   |---models/
|   |   |---action.ts
|   |   |---creep-role.ts
|   |   |---room-role.ts
|   |---prototypes/
|   |   |---creep.ts
|   |   |---room.ts
|   |   |---structure.ts
|   |---registry/
|   |   |---action-registry.ts
|   |   |---creep-role-registry.ts
|   |   |---room-role-registry.ts
|   |---utils/
|   |   |---create-body.ts
|   |   |---priority.ts
|---creep-actions/
|---creep-roles/
|---room-actions/
|---room-roles/
|
|---index.ts
```

# Install
```bash
$ git submodule init
$ git submodule update # install Traveler
$ npm install
```

# Compile
```bash
$ npm run build
```

# Develop
```bash
$ npm run debug
```

# License
MIT
