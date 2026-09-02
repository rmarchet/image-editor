import { Container } from 'pixi.js';
import type { ElementSnapshot } from '../../types';

let nextId = 1;

export abstract class BaseElement {
  readonly id: string;
  readonly type: string;
  readonly container: Container;
  protected _locked = false;
  protected _name: string;
  protected _appliedFilterId: string | null = null;

  constructor(type: string) {
    this.id = `el-${nextId++}`;
    this.type = type;
    this.container = new Container();
    this.container.eventMode = 'static';
    this.container.cursor = 'pointer';
    this._name = `${type} ${nextId - 1}`;
  }

  get x() {
    return this.container.x;
  }
  set x(v: number) {
    this.container.x = v;
  }

  get y() {
    return this.container.y;
  }
  set y(v: number) {
    this.container.y = v;
  }

  abstract get width(): number;
  abstract set width(v: number);
  abstract get height(): number;
  abstract set height(v: number);

  get rotation(): number {
    return (this.container.rotation * 180) / Math.PI;
  }
  set rotation(degrees: number) {
    this.container.rotation = (degrees * Math.PI) / 180;
  }

  get opacity(): number {
    return this.container.alpha;
  }
  set opacity(v: number) {
    this.container.alpha = Math.max(0, Math.min(1, v));
  }

  get locked() {
    return this._locked;
  }
  set locked(v: boolean) {
    this._locked = v;
    this.container.eventMode = v ? 'none' : 'static';
    this.container.cursor = v ? 'default' : 'pointer';
  }

  get visible() {
    return this.container.visible;
  }
  set visible(v: boolean) {
    this.container.visible = v;
  }

  get name() {
    return this._name;
  }
  set name(v: string) {
    this._name = v;
  }

  get appliedFilterId() {
    return this._appliedFilterId;
  }

  set appliedFilterId(filterId: string | null) {
    this._appliedFilterId = filterId;
  }

  toSnapshot(): ElementSnapshot {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      opacity: this.opacity,
      name: this.name,
      locked: this.locked,
      visible: this.visible,
      appliedFilterId: this.appliedFilterId,
    };
  }

  /** Override in subclasses to support duplication. Return null if not cloneable. */
  clone(): BaseElement | null {
    return null;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}
