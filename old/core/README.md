Action Runner
============

# How this works?

Everything that I want to be intelligent (Creep, Room, etc) is called an `Agent`. Every `Agent` should contains at least one group of `Action`s. Every tick the `AgentRunner` will run each `Agent`'s group of `Action`s in order.

For instance, if one creep (an `Agent`) start the tick with this groups of `Action`s in memory:

```js
creep.memory.actions = [
    // action #1     action #2
    ['get_energy', 'fill_spawn'], // group #1

    // action #1
    ['die_in_peace']              // group #2
]
```

Them the `AgentRunner` will execute in this order:
- Run the first group: `['get_energy', 'fill_spawn']`
  -  Run the first action: `'get_energy'`
     - From `get_energy`'s return value, decide what to do next
  - ...
- Run the second group: `['die_in_peace']`
  - Run the first action: `'die_in_peace'`
    - From `die_in_peace`'s return value, decide what to do next
  - ...

This way, one `Action` can `UNSHIFT` more actions to the group, `WAIT` until something happend, have dependencies (i.e. `fill_spawn` needs `get_energy`). Many groups can be executed at the same tick. It's easy to reuse `Action`s between Creeps Roles.

## Action
`Action` is actually a `function` registered in the `ActionRegistry` who should return one of those values:
- `Action.SHIFT_AND_CONTINUE`: Remove the current action and run the next action in the group.
- `Action.SHIFT_AND_STOP`: Remove the current action and the next group.
- `Action.WAIT_NEXT_TICK`: Run the next group.
- `Action.UNSHIFT_AND_CONTINUE`: Unshift more actions to the group and run the first action in the group.
- `Action.UNSHIFT_AND_STOP`: Unshift more actions to the group and run the next group.
- `Action.SHIFT_UNSHIFT_AND_CONTINUE`: Remove the current action, unshift more actions to the group and run the first actions in the group.
- `Action.SHIFT_UNSHIFT_AND_STOP`: Remove the currenct actions, unshift more actions to the group and run the next group.

The default return value is `Agent.WAIT_NEXT_TICK`.

### Actions's return examples:
```js
    // ...
    return [Agent.UNSHIFT_AND_CONTINUE, 'move_to', 'get_energy']

    // ...
    return Agent.SHIFT_AND_CONTINUE

    // ...
    return [Agent.WAIT_NEXT_TICK]
```
```mermaid
```
