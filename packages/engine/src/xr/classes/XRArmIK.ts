import { Quaternion, Vector3, Euler, Matrix4 } from 'three'
import { Helpers } from '../functions/Helpers'

const zeroVector = new Vector3()
const forwardVector = new Vector3(0, 0, 1)
const leftRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
const rightRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)
const bankLeftRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)
const bankRightRotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -Math.PI / 2)
const z180Quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI)

const localVector = new Vector3()
const localVector2 = new Vector3()
const localVector3 = new Vector3()
const localVector4 = new Vector3()
const localVector5 = new Vector3()
const localVector6 = new Vector3()
const localQuaternion = new Quaternion()
const localQuaternion2 = new Quaternion()
const localQuaternion3 = new Quaternion()
const localEuler = new Euler()
const localMatrix = new Matrix4()

const FINGER_SPECS = [
  [2, 'thumb0'],
  [3, 'thumb1'],
  [4, 'thumb2'],

  // [6, 'indexFinger0'],
  [7, 'indexFinger1'],
  [8, 'indexFinger2'],
  [9, 'indexFinger3'],

  // [11, 'middleFinger0'],
  [12, 'middleFinger1'],
  [13, 'middleFinger2'],
  [14, 'middleFinger3'],

  // [16, 'ringFinger0'],
  [17, 'ringFinger1'],
  [18, 'ringFinger2'],
  [19, 'ringFinger3'],

  // [21, 'littleFinger0'],
  [22, 'littleFinger1'],
  [23, 'littleFinger2'],
  [24, 'littleFinger3']
]

/**
 *
 * @author Avaer Kazmer
 */
class XRArmIK {
  armature: any
  shoulder: any
  shoulderPoser: any
  target: any
  left: any
  upperArmLength: number
  lowerArmLength: number
  armLength: number
  constructor(armature, shoulder, shoulderPoser, target, left) {
    this.armature = armature
    this.shoulder = shoulder
    this.shoulderPoser = shoulderPoser
    this.target = target
    this.left = left

    this.upperArmLength = 0
    this.lowerArmLength = 0
    this.armLength = 0
  }

  Start() {
    this.upperArmLength = Helpers.getWorldPosition(this.armature.lowerArm, localVector).distanceTo(
      Helpers.getWorldPosition(this.armature.upperArm, localVector2)
    )
    this.lowerArmLength = Helpers.getWorldPosition(this.armature.hand, localVector).distanceTo(
      Helpers.getWorldPosition(this.armature.lowerArm, localVector2)
    )
    this.armLength = this.upperArmLength + this.lowerArmLength
  }

  Update() {
    Helpers.updateMatrixWorld(this.armature.transform)
    Helpers.updateMatrixWorld(this.armature.upperArm)

    const upperArmPosition = Helpers.getWorldPosition(this.armature.upperArm, localVector)
    const handRotation = this.target.quaternion
    const handPosition = localVector2.copy(this.target.position)

    const shoulderRotation = Helpers.getWorldQuaternion(this.shoulder.transform, localQuaternion)
    const shoulderRotationInverse = localQuaternion2.copy(shoulderRotation).invert()

    const hypotenuseDistance = this.upperArmLength
    const directDistance = upperArmPosition.distanceTo(handPosition) / 2
    const offsetDistance =
      hypotenuseDistance > directDistance
        ? Math.sqrt(hypotenuseDistance * hypotenuseDistance - directDistance * directDistance)
        : 0
    const offsetDirection = localVector3
      .copy(handPosition)
      .sub(upperArmPosition)
      .normalize()
      .cross(localVector4.set(-1, 0, 0).applyQuaternion(shoulderRotation))

    const targetEuler = localEuler.setFromQuaternion(
      localQuaternion3.multiplyQuaternions(handRotation, shoulderRotationInverse).premultiply(z180Quaternion),
      'XYZ'
    )
    // const targetDirection = new Vector3(0, 0, 1).applyQuaternion(targetLocalRotation);
    if (this.left) {
      const yFactor = Math.min(Math.max((targetEuler.y + Math.PI * 0.1) / (Math.PI / 2), 0), 1)
      // const zFactor = Math.min(Math.max((-targetDirection.x + 0.5)/0.25, 0), 1)
      // const xFactor = Math.min(Math.max((targetDirection.y-0.8)/0.2, 0), 1);
      // yFactor *= 1-xFactor;
      // const factor = Math.min(yFactor, 1-xFactor);//Math.min(yFactor, 1-xFactor);
      targetEuler.z = Math.min(Math.max(targetEuler.z, -Math.PI / 2), 0)
      targetEuler.z = targetEuler.z * (1 - yFactor) + (-Math.PI / 2) * yFactor
      // targetEuler.z *= 1 - xFactor;
      // targetEuler.z *= 1 - zFactor;
    } else {
      const yFactor = Math.min(Math.max((-targetEuler.y - Math.PI * 0.1) / (Math.PI / 2), 0), 1)
      // const zFactor = Math.min(Math.max((-targetDirection.x + 0.5)/0.25, 0), 1)
      // const xFactor = Math.min(Math.max((targetDirection.y-0.8)/0.2, 0), 1);
      // yFactor *= 1-xFactor;
      // const factor = Math.min(yFactor, 1-xFactor);//Math.min(yFactor, 1-xFactor);
      targetEuler.z = Math.min(Math.max(targetEuler.z, 0), Math.PI / 2)
      targetEuler.z = targetEuler.z * (1 - yFactor) + (Math.PI / 2) * yFactor
      // targetEuler.z *= 1 - xFactor;
      // targetEuler.z *= 1 - zFactor;
    }
    offsetDirection
      .applyQuaternion(shoulderRotationInverse)
      .applyAxisAngle(forwardVector, targetEuler.z)
      .applyQuaternion(shoulderRotation)

    const elbowPosition = localVector4
      .copy(upperArmPosition)
      .add(handPosition)
      .divideScalar(2)
      .add(localVector5.copy(offsetDirection).multiplyScalar(offsetDistance))
    const upVector = localVector5.set(this.left ? -1 : 1, 0, 0).applyQuaternion(shoulderRotation)
    this.armature.upperArm.quaternion
      .setFromRotationMatrix(
        localMatrix.lookAt(zeroVector, localVector6.copy(elbowPosition).sub(upperArmPosition), upVector)
      )
      .multiply(this.left ? rightRotation : leftRotation)
      .premultiply(Helpers.getWorldQuaternion(this.armature.upperArm.parent, localQuaternion3).invert())
    Helpers.updateMatrixMatrixWorld(this.armature.upperArm)

    this.armature.lowerArm.quaternion
      .setFromRotationMatrix(
        localMatrix.lookAt(zeroVector, localVector6.copy(handPosition).sub(elbowPosition), upVector)
      )
      .multiply(this.left ? rightRotation : leftRotation)
      .premultiply(Helpers.getWorldQuaternion(this.armature.lowerArm.parent, localQuaternion3).invert())
    Helpers.updateMatrixMatrixWorld(this.armature.lowerArm)

    this.armature.hand.quaternion
      .copy(this.target.quaternion)
      .multiply(this.left ? bankRightRotation : bankLeftRotation)
      .premultiply(Helpers.getWorldQuaternion(this.armature.hand.parent, localQuaternion3).invert())
    Helpers.updateMatrixMatrixWorld(this.armature.hand)

    for (const fingerSpec of FINGER_SPECS) {
      const [index, key] = fingerSpec
      this.armature[key].quaternion.copy(this.target.fingers[index].quaternion)
      Helpers.updateMatrixMatrixWorld(this.armature[key])
    }
  }
}

export default XRArmIK
