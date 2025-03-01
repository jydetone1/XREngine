import { isClient } from '../../common/functions/isClient'
import { Component } from '../../ecs/classes/Component'
import { Entity } from '../../ecs/classes/Entity'
import { addComponent, getComponent, hasComponent } from '../../ecs/functions/EntityFunctions'
import { ComponentConstructor } from '../../ecs/interfaces/ComponentInterfaces'
import { Network } from '../../networking/classes/Network'
import { Game } from '../components/Game'
import { GameObject } from '../components/GameObject'
import { GamePlayer } from '../components/GamePlayer'
import { Action } from '../types/GameComponents'
import { GameStateActionMessage } from '../types/GameMessage'
import {
  getEntityFromRoleUuid,
  getGame,
  getGameEntityFromName,
  getRole,
  getUuid,
  isOwnedLocalPlayer
} from './functions'
/**
 * @author HydraFire <github.com/HydraFire>
 */

let gamePredictionCheckList = []
const timeAfterClientDesideHeWasgetWrongAction = 3000

export const addActionComponent = (
  entity: Entity,
  component: ComponentConstructor<Component<any>>,
  componentArgs: any = {}
): void => {
  if (!(hasComponent(entity, GameObject) || hasComponent(entity, GamePlayer))) return
  const game = getGame(entity)
  //// Clients dont apply self actions, only in not Global mode
  if (isClient && !game.isGlobal) {
    addComponent(entity, component, componentArgs)
    //// Server apply actions to himself send Actions and clients apply its
  } else if (isClient && game.isGlobal && isOwnedLocalPlayer(entity)) {
    addComponent(entity, component, componentArgs)
    addToCheckList(entity, component, componentArgs)
  } else if (!isClient && game.isGlobal) {
    addComponent(entity, component, componentArgs)
    sendActionComponent(entity, component, componentArgs)
  }
}

export const sendActionComponent = (
  entity: Entity,
  component: ComponentConstructor<Component<any>>,
  componentArgs: any = {}
): void => {
  const actionMessage: GameStateActionMessage = {
    game: getGame(entity).name,
    role: getRole(entity),
    component: component.name,
    uuid: getUuid(entity),
    componentArgs: JSON.stringify(componentArgs).replace(/"/g, "'") // replace double quotes with single quotes so it is read properly in buffer
  }
  // console.log('sendActionComponent', actionMessage);
  Network.instance.worldState.gameStateActions.push(actionMessage)
}

export const applyActionComponent = (actionMessage: GameStateActionMessage): void => {
  // console.warn('applyActionComponent', actionMessage);
  const entityGame = getGameEntityFromName(actionMessage.game)
  if (!entityGame) return
  const game = getComponent(entityGame, Game)
  //  console.warn(game);
  const entity = getEntityFromRoleUuid(game, actionMessage.role, actionMessage.uuid)
  if (!entity) return

  if (isOwnedLocalPlayer(entity) && ifWasSameBeforeByPrediction(actionMessage)) {
    removeSameInGamePredictionCheckList(actionMessage)
    return
  }

  const component = Action[actionMessage.component]
  let componentArgs = {}
  try {
    componentArgs = JSON.parse(actionMessage.componentArgs.replace(/'/g, '"')) // replace single quotes with double quotes
  } catch (e) {}
  addComponent(entity, component, componentArgs)
}

const addToCheckList = (
  entity: Entity,
  component: ComponentConstructor<Component<any>>,
  componentArgs: any = {}
): void => {
  const actionOnWhyRole = getRole(entity)

  gamePredictionCheckList.push({
    componentName: component.name,
    time: Date.now(),
    dataForCheck: {
      role: actionOnWhyRole
    }
  })
}

export const checkIsGamePredictionStillRight = (): boolean => {
  //gamePredictionCheckList.length > 0 ? console.log(gamePredictionCheckList):'';
  return gamePredictionCheckList.some((v) => Date.now() - v.time > timeAfterClientDesideHeWasgetWrongAction)
}

const ifWasSameBeforeByPrediction = (actionMessage: GameStateActionMessage): boolean => {
  return gamePredictionCheckList.some(
    (v) => v.componentName === actionMessage.component && v.dataForCheck.role === actionMessage.role
  )
}

const removeSameInGamePredictionCheckList = (actionMessage: GameStateActionMessage): void => {
  gamePredictionCheckList = gamePredictionCheckList.filter(
    (v) => !(v.componentName === actionMessage.component && v.dataForCheck.role === actionMessage.role)
  )
}

export const clearPredictionCheckList = (): void => {
  gamePredictionCheckList = []
}
