import { Vector3 } from 'three'

const localVector = new Vector3()
const localVector2 = new Vector3()

/**
 *
 * @author Avaer Kazmer
 */
const Helpers = {
  getWorldPosition(o, v) {
    return v.setFromMatrixPosition(o.matrixWorld)
  },
  getWorldQuaternion(o, q) {
    o.matrixWorld.decompose(localVector, q, localVector2)
    return q
  },
  getWorldScale(o, v) {
    return v.setFromMatrixScale(o.matrixWorld)
  },
  updateMatrix(o) {
    o.matrix.compose(o.position, o.quaternion, o.scale)
  },
  updateMatrixWorld(o) {
    o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix)
  },
  updateMatrixMatrixWorld(o) {
    o.matrix.compose(o.position, o.quaternion, o.scale)
    o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix)
  },
  copyTransform(dst, src) {
    dst.position.copy(src.position)
    dst.quaternion.copy(src.quaternion)
    dst.scale.copy(src.scale)
  }
}

export { Helpers }
