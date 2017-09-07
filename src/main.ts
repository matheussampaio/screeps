import { Kernel } from './kernel'
import { Stats } from './utils'

import { install } from './prototypes'

install()

import { InitProcess } from './processes'

import { PRIORITY } from './utils'

export function loop() {
    console.log(`#${Game.time}`)

    Kernel.load()

    if (Kernel.getProcessByPID(0) == null) {
        InitProcess.fork(0, { pid: 0, priority: PRIORITY.VERY_HIGH })
    }

    Kernel.run()
    Kernel.save()

    Stats.collect()
}
