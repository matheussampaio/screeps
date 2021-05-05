import * as _ from 'lodash'

import { ActionsRegistry } from '../../core'
import { ICityContext } from './interfaces'
import { City } from './city'

@ActionsRegistry.register
export class CityMarket extends City {
  run(context: ICityContext) {
    this.context = context

    if (this.terminal == null) {
      return this.sleep(50)
    }

    if (this.terminal.store.getUsedCapacity() === 0) {
      return this.sleep(50)
    }

    if (Game.time % 10 !== 0) {
      return this.waitNextTick()
    }

    return this.sellResource() || this.sellEnergy() || this.waitNextTick()
  }
  sellEnergy() {
    const RESOURCES_TO_SELL = 10000

    if (this.terminal == null || this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) < RESOURCES_TO_SELL * 2) {
      return null
    }

    const history = Game.market.getHistory(RESOURCE_ENERGY)

    if (history.length === 0) {
      return null
    }

    const avgEnergySellPrice = (history.reduce((sum, curr) => sum + curr.avgPrice, 0) / history.length)

    const orders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY })
      .map(o => {
        const energyCost = Game.market.calcTransactionCost(1, this.room.name, o.roomName as string)

        return {
          ...o,
          energyCost,
          actualPrice: o.price - energyCost * avgEnergySellPrice
        }
      })

    orders.sort((o1, o2) => o2.actualPrice - o1.actualPrice)

    if (orders.length === 0) {
      return null
    }

    const order = orders[0]
    const amountToSell = Math.min(RESOURCES_TO_SELL, order.remainingAmount)

    console.log('SELL ENERGY:', 'amount=', amountToSell, 'energyCost=', order.energyCost, 'price=', order.price, 'CREDIT=', amountToSell * order.price, 'TOTAL_ENERGY=', amountToSell * order.energyCost)

    const result = Game.market.deal(order.id, amountToSell, this.room.name)

    console.log('SELL RESULT=', result)

    return this.waitNextTick()
  }
  sellResource() {
    const RESOURCES_TO_SELL = 2500

    if (this.terminal == null) {
      return null
    }

    for (const resourceType in this.terminal.store) {
      if (resourceType === RESOURCE_ENERGY) {
        continue
      }

      const history = Game.market.getHistory(resourceType as ResourceConstant)

      if (history.length === 0) {
        return null
      }

      const avgResourceSellPrice = history.reduce((sum, curr) => sum + curr.avgPrice, 0) / history.length

      const orders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: resourceType as ResourceConstant })
        .map((o: Order) => {
          const energyCost = Game.market.calcTransactionCost(1, this.room.name, o.roomName as string)

          return {
            ...o,
            energyCost,
            actualPrice: o.price - energyCost * avgResourceSellPrice
          }
        })

      orders.sort((o1, o2) => o2.actualPrice - o1.actualPrice)

      if (orders.length === 0) {
        return null
      }

      const order = orders[0]
      const amountToSell = Math.min(RESOURCES_TO_SELL, order.remainingAmount)

      console.log(`SELL ${resourceType}:`, 'amount=', amountToSell, 'energyCost=', order.energyCost, 'price=', order.price, 'CREDIT=', amountToSell * order.price, 'TOTAL_ENERGY=', amountToSell * order.energyCost)

      // if not enough energy to send this resource, wait it (we will try to get rid of other types of resources first)
      if (this.terminal.store.getUsedCapacity(RESOURCE_ENERGY) < amountToSell * order.energyCost) {
        return this.waitNextTick()
      }

      const result = Game.market.deal(order.id, amountToSell, this.room.name)

      console.log('SELL RESULT', result)

      return this.waitNextTick()
    }

    return null
  }
}

