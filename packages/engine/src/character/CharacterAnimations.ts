export enum CharacterAnimations {
  // Main States
  DEFAULT,
  JUMP,
  FALLING,
  DROP,

  // Modifier States
  WALK,
  SPRINT,
  INTERACTING,

  DROP_IDLE,
  DROP_ROLLING,
  DROP_RUNNING,

  // Driving substates
  DRIVING,
  ENTERING_VEHICLE_DRIVER,
  EXITING_VEHICLE_DRIVER,
  ENTERING_VEHICLE_PASSENGER,
  EXITING_VEHICLE_PASSENGER,

  IDLE,
  FALLING_LONG,
  WALK_FORWARD,
  WALK_STRAFE_RIGHT,
  WALK_STRAFE_LEFT,
  RUN_FORWARD,
  RUN_BACKWARD,
  RUN_STRAFE_RIGHT,
  RUN_STRAFE_LEFT,
  WALK_BACKWARD
}
