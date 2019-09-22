import { Analytics, Kernel, LOG_LEVEL } from './os'
import { Boot } from './programs'
import getVersion from './utils/version'

const kernel = new Kernel(Boot, { analytics: new Analytics() })

export function loop() {
  kernel.log.info(`[${getVersion()}] Tick #${Game.time}`)

  kernel.tick()
}
