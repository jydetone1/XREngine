/** @returns Whether is MyPlayer or not. */

import { getComponent } from '../../ecs/functions/EntityFunctions'
import { Network } from '../../networking/classes/Network'
import { NetworkObject } from '../../networking/components/NetworkObject'
import { isClient } from './isClient'

export const isMyPlayer = function (entity) {
  return isClient && getComponent(entity, NetworkObject).networkId == Network.instance.localAvatarNetworkId
}
