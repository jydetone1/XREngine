import { Component } from '../../ecs/classes/Component'
import { Types } from '../../ecs/types/Types'
import { Entity } from '../../ecs/classes/Entity'

/**
 * @author HydraFire <github.com/HydraFire>
 */

export class SubFocused extends Component<SubFocused> {
  subInteracts: Entity

  static _schema = {
    subInteracts: { type: Types.Ref }
  }
}
