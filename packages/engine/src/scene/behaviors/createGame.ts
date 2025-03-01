import { Behavior } from '../../common/interfaces/Behavior'
import { addComponent, getMutableComponent } from '../../ecs/functions/EntityFunctions'
import { Game } from '../../game/components/Game'
import { GameObject } from '../../game/components/GameObject'
import { TransformComponent } from '../../transform/components/TransformComponent'
import { Engine } from '../../ecs/classes/Engine'

interface GameDataProps {
  minPlayers: number
  maxPlayers: number
  isGlobal: boolean
  name: string
  gameName: string
  gameMode: string
  sceneEntityId: string
  role: string
}

export const createGame: Behavior = (entity, args: GameDataProps) => {
  console.log(args.gameMode + ' GAME LOADING ...')

  const transform = getMutableComponent(entity, TransformComponent)
  transform.scale.set(Math.abs(transform.scale.x) / 2, Math.abs(transform.scale.y) / 2, Math.abs(transform.scale.z) / 2)

  const p = transform.position
  const s = transform.scale
  const min = { x: -s.x + p.x, y: -s.y + p.y, z: -s.z + p.z }
  const max = { x: s.x + p.x, y: s.y + p.y, z: s.z + p.z }

  const gameData = {
    name: args.name,
    isGlobal: args.isGlobal,
    minPlayers: args.minPlayers,
    maxPlayers: args.maxPlayers,
    gameMode: args.gameMode,
    gameArea: { min, max }
  }

  addComponent(entity, Game, gameData)
  // register spawn objects prefabs
  const gameSchema = Engine.gameModes[args.gameMode]
  gameSchema.onGameLoading(entity)
}

export const createGameObject: Behavior = (entity, args: GameDataProps) => {
  if (args.sceneEntityId === undefined) {
    console.warn('DONT SAVE COLLIDER FOR GAME OBJECT')
  }

  // if (!isClient && !args.isGlobal) {
  //   removeEntity(entity);
  //   return;
  // }

  addComponent(entity, GameObject, {
    gameName: args.gameName,
    role: args.role,
    uuid: args.sceneEntityId
  })
}
