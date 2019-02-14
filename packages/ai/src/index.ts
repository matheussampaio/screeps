import { Kernel } from '@sae/os'

import { Boot } from './programs';

const kernel = new Kernel(Boot)

export function loop() {
  console.log(`Tick #${Game.time}`)

  kernel.start()
}
