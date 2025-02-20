import { DirectionalLight, Vector2 } from 'three'
import { isClient } from '../../common/functions/isClient'
import { isMobile } from '../../common/functions/isMobile'
import { Entity } from '../../ecs/classes/Entity'
import { ScenePropertyType } from '../functions/SceneLoading'
import { SceneDataComponent } from '../interfaces/SceneDataComponent'
import { addObject3DComponent } from './addObject3DComponent'
import { createObject3dFromArgs } from './createObject3dFromArgs'

export const createDirectionalLight = (
  entity: Entity,
  component: SceneDataComponent,
  sceneProperty: ScenePropertyType
) => {
  if (!isClient) return

  const mapSize = new Vector2().fromArray(component.data.shadowMapResolution)

  if (isMobile) {
    mapSize.set(512, 512)
  }

  const args = {
    obj3d: DirectionalLight,
    objArgs: {
      'shadow.mapSize': mapSize,
      'shadow.bias': component.data.shadowBias,
      'shadow.radius': component.data.shadowRadius,
      intensity: component.data.intensity,
      color: component.data.color,
      castShadow: component.data.castShadow,
      'shadow.camera.far': component.data.cameraFar
    }
  }

  if (sceneProperty.isCSMEnabled) {
    const object3d = createObject3dFromArgs(entity, args, false)
    console.log(object3d)
    sceneProperty.directionalLights.push(object3d)
  } else {
    addObject3DComponent(entity, args)
  }
}
