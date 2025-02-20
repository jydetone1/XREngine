import { Component } from '../../ecs/classes/Component'
import { Types } from '../../ecs/types/Types'

/**
 * @author HydraFire <github.com/HydraFire>
 */

export class InterpolationComponent extends Component<any> {
  lastUpdate = 0
  updateDaley = 1000
}

InterpolationComponent._schema = {
  lastUpdate: { type: Types.Number, default: 0 }
}
