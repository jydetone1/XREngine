import { Component } from './Component'
import { ComponentConstructor } from '../interfaces/ComponentInterfaces'

/**
 * Interface for System state components
 *
 * @author Fernando Serrano, Robert Long
 */
export interface SystemStateComponentConstructor<C extends Component<any>> extends ComponentConstructor<C> {
  isSystemStateComponent: true
  new (): C
}

/**
 * Class for System State Component.
 *
 * @author Fernando Serrano, Robert Long
 */
export class SystemStateComponent<C> extends Component<C> {
  /** Marks component as System State Component */
  static isSystemStateComponent = true
}
