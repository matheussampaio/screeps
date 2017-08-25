import { Kernel } from './kernel'
import { Stats  } from './utils/stats'

export function loop() {
    Kernel.load()
    Kernel.run()
    Kernel.save()

    Stats.collect()
}
