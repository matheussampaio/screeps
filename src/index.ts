import { Analytics, Kernel } from './os'
import { Boot } from './programs'

const kernel = new Kernel(Boot, { analytics: new Analytics() })

export function loop() {
  console.log(`Tick #${Game.time}`)

  kernel.tick()
}
