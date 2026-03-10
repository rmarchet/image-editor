import { Graphics } from 'pixi.js';
import { BaseElement } from './BaseElement';
import type { ShapeType } from '../../types';

export interface ShapeConfig {
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  shapeWidth: number;
  shapeHeight: number;
}

const DEFAULT_CONFIG: ShapeConfig = {
  shapeType: 'rectangle',
  fillColor: '#3b82f6',
  strokeColor: '#1e40af',
  strokeWidth: 2,
  shapeWidth: 200,
  shapeHeight: 150,
};

export class ShapeElement extends BaseElement {
  private graphics: Graphics;
  private _config: ShapeConfig;

  constructor(config: Partial<ShapeConfig> = {}) {
    super('shape');
    this._config = { ...DEFAULT_CONFIG, ...config };
    this.name = this.buildDefaultName(this._config.shapeType);
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
    this.draw();
  }

  private buildDefaultName(shapeType: ShapeType) {
    const suffix = this.id.replace('el-', '');
    return `${shapeType} ${suffix}`;
  }

  private drawRegularPolygon(sides: number, width: number, height: number) {
    if (sides < 3) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    const startAngle = -Math.PI / 2;

    for (let index = 0; index < sides; index++) {
      const angle = startAngle + (index * Math.PI * 2) / sides;
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;

      if (index === 0) {
        this.graphics.moveTo(x, y);
      } else {
        this.graphics.lineTo(x, y);
      }
    }

    this.graphics.closePath();
  }

  private drawStar(width: number, height: number) {
    const points = 5;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadiusX = width / 2;
    const outerRadiusY = height / 2;
    const innerRadiusX = outerRadiusX * 0.45;
    const innerRadiusY = outerRadiusY * 0.45;
    const startAngle = -Math.PI / 2;

    for (let index = 0; index < points * 2; index++) {
      const isOuterPoint = index % 2 === 0;
      const radiusX = isOuterPoint ? outerRadiusX : innerRadiusX;
      const radiusY = isOuterPoint ? outerRadiusY : innerRadiusY;
      const angle = startAngle + (index * Math.PI) / points;
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;

      if (index === 0) {
        this.graphics.moveTo(x, y);
      } else {
        this.graphics.lineTo(x, y);
      }
    }

    this.graphics.closePath();
  }

  private drawHeart(width: number, height: number) {
    const pointCount = 80;
    const rawPoints: { x: number; y: number }[] = [];
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (let index = 0; index <= pointCount; index++) {
      const t = (index / pointCount) * Math.PI * 2;
      const rawX = 16 * Math.pow(Math.sin(t), 3);
      const rawY =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);

      rawPoints.push({ x: rawX, y: rawY });
      minX = Math.min(minX, rawX);
      minY = Math.min(minY, rawY);
      maxX = Math.max(maxX, rawX);
      maxY = Math.max(maxY, rawY);
    }

    const scaleX = width / Math.max(1, maxX - minX);
    const scaleY = height / Math.max(1, maxY - minY);

    for (let index = 0; index < rawPoints.length; index++) {
      const point = rawPoints[index];
      const x = (point.x - minX) * scaleX;
      const y = (maxY - point.y) * scaleY;

      if (index === 0) {
        this.graphics.moveTo(x, y);
      } else {
        this.graphics.lineTo(x, y);
      }
    }

    this.graphics.closePath();
  }

  private draw() {
    const g = this.graphics;
    const { shapeType, fillColor, strokeColor, strokeWidth, shapeWidth, shapeHeight } =
      this._config;

    g.clear();

    switch (shapeType) {
      case 'rectangle':
        g.rect(0, 0, shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'ellipse':
        g.ellipse(shapeWidth / 2, shapeHeight / 2, shapeWidth / 2, shapeHeight / 2);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'line':
        g.moveTo(0, 0);
        g.lineTo(shapeWidth, shapeHeight);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'arrow': {
        g.moveTo(0, shapeHeight / 2);
        g.lineTo(shapeWidth - 15, shapeHeight / 2);
        g.stroke({ width: strokeWidth, color: strokeColor });
        const headSize = 12;
        g.moveTo(shapeWidth, shapeHeight / 2);
        g.lineTo(shapeWidth - headSize, shapeHeight / 2 - headSize / 2);
        g.lineTo(shapeWidth - headSize, shapeHeight / 2 + headSize / 2);
        g.closePath();
        g.fill(strokeColor);
        break;
      }
      case 'triangle':
        this.drawRegularPolygon(3, shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'pentagon':
        this.drawRegularPolygon(5, shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'hexagon':
        this.drawRegularPolygon(6, shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'star':
        this.drawStar(shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'heart':
        this.drawHeart(shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
    }

    this.container.pivot.set(shapeWidth / 2, shapeHeight / 2);
  }

  get width(): number {
    return this._config.shapeWidth;
  }
  set width(v: number) {
    this._config.shapeWidth = v;
    this.draw();
  }

  get height(): number {
    return this._config.shapeHeight;
  }
  set height(v: number) {
    this._config.shapeHeight = v;
    this.draw();
  }

  get config() {
    return { ...this._config };
  }

  updateConfig(updates: Partial<ShapeConfig>) {
    this._config = { ...this._config, ...updates };
    this.draw();
  }

  clone(): ShapeElement {
    const c = new ShapeElement(this._config);
    c.x = this.x;
    c.y = this.y;
    c.rotation = this.rotation;
    c.opacity = this.opacity;
    c.name = `${this.name} (copy)`;
    return c;
  }
}
