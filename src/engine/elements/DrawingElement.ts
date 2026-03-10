import { Graphics } from 'pixi.js';
import { BaseElement } from './BaseElement';
import type { DrawingStrokeData } from '../../types';

function cloneStrokes(strokes: DrawingStrokeData[]): DrawingStrokeData[] {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));
}

export class DrawingElement extends BaseElement {
  private graphics: Graphics;
  private _strokes: DrawingStrokeData[];
  private _width = 0;
  private _height = 0;

  constructor(strokes: DrawingStrokeData[] = []) {
    super('drawing');
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    this._strokes = cloneStrokes(strokes);
    this.redraw();
  }

  private redraw() {
    this.graphics.clear();

    for (const stroke of this._strokes) {
      if (stroke.points.length === 0) continue;

      const [first, ...rest] = stroke.points;
      this.graphics.circle(first.x, first.y, stroke.size / 2);
      this.graphics.fill({ color: stroke.color, alpha: stroke.opacity });

      let previous = first;
      for (const point of rest) {
        this.graphics.moveTo(previous.x, previous.y);
        this.graphics.lineTo(point.x, point.y);
        this.graphics.stroke({
          width: stroke.size,
          color: stroke.color,
          alpha: stroke.opacity,
        });
        previous = point;
      }
    }

    this.updateBounds();
  }

  private updateBounds() {
    const bounds = this.graphics.getBounds();
    this._width = bounds.width;
    this._height = bounds.height;
  }

  get width(): number {
    return this._width;
  }
  set width(v: number) {
    this._width = v;
  }

  get height(): number {
    return this._height;
  }
  set height(v: number) {
    this._height = v;
  }

  get strokes(): DrawingStrokeData[] {
    return cloneStrokes(this._strokes);
  }

  addStroke(stroke: DrawingStrokeData) {
    this._strokes.push({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point })),
    });
    this.redraw();
  }

  clone(): DrawingElement {
    const copy = new DrawingElement(this._strokes);
    copy.x = this.x;
    copy.y = this.y;
    copy.rotation = this.rotation;
    copy.opacity = this.opacity;
    copy.locked = this.locked;
    copy.visible = this.visible;
    copy.container.scale.set(this.container.scale.x, this.container.scale.y);
    copy.name = `${this.name} (copy)`;
    return copy;
  }
}
