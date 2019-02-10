import { Kernel } from './os'
// import { Boot } from "./programs";

export function loop() {
  console.log(`Tick #${Game.time}`)

  Kernel.start()
}
