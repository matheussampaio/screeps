import { Kernel } from '@sae/os'

import { Boot } from './programs';

Kernel.BootProcess = Boot

export function loop() {
  console.log(`Tick #${Game.time}`)

  Kernel.start()
}
