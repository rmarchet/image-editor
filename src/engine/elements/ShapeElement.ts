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

  private drawCloud(width: number, height: number) {
    // Nuvola classica: 3 cerchi di diversa dimensione + base dritta
    const g = this.graphics;
    const baseY = height * 0.6;

    // Tre cerchi di diverse dimensioni
    const left =   { cx: width * 0.18, cy: baseY - 5, r: width * 0.18 };
    const center = { cx: width * 0.45, cy: height * 0.34, r: width * 0.23 };
    const right =  { cx: width * 0.75, cy: baseY - 5, r: width * 0.25 };

    const steps = 400;
    const outline: { x: number; y: number }[] = [];

    // Calcola l'inviluppo superiore (il punto più alto per ogni colonna x)
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      let minY = baseY;

      for (const p of [left, center, right]) {
        const dx = x - p.cx;
        if (Math.abs(dx) < p.r) {
          const arcY = p.cy - Math.sqrt(p.r * p.r - dx * dx);
          minY = Math.min(minY, arcY);
        }
      }

      outline.push({ x, y: minY });
    }

    // Contorno superiore (la parte fluffy)
    g.moveTo(0, baseY);
    for (const p of outline) {
      g.lineTo(p.x, p.y);
    }

    // Base dritta (linea orizzontale)
    g.lineTo(width, baseY);
    g.lineTo(0, baseY);
    g.closePath();
  }

  private drawDiamond(width: number, height: number) {
    const centerX = width / 2;
    const centerY = height / 2;

    this.graphics.moveTo(centerX, 0);
    this.graphics.lineTo(width, centerY);
    this.graphics.lineTo(centerX, height);
    this.graphics.lineTo(0, centerY);
    this.graphics.closePath();
  }

  private drawCrescent(width: number, height: number) {
    const R = Math.min(width, height) / 2;
    const cx = width / 2;
    const cy = height / 2;
    const d = R * 0.55; // distanza tra i centri dei due cerchi
    const points = 100;

    // Altezza del punto di intersezione
    const h = Math.sqrt(R * R - (d * d) / 4);

    // Angoli dei punti di intersezione su Cerchio A (centro: cx, cy)
    const aTop = Math.atan2(-h, d / 2);
    const aBot = Math.atan2(h, d / 2);

    // Angoli dei punti di intersezione su Cerchio B (centro: cx+d, cy)
    const bBot = Math.atan2(h, -d / 2);
    const bTop = Math.atan2(-h, -d / 2);

    // Arco 1: arco SINISTRO del Cerchio A (la parte non coperta da B)
    // Da punto intersezione alto, decrescendo angolo, passando per ±π, fino a punto basso
    const sweep1 = 2 * Math.PI - (aBot - aTop);
    this.graphics.moveTo(cx + Math.cos(aTop) * R, cy + Math.sin(aTop) * R);

    for (let i = 1; i <= points; i++) {
      const angle = aTop - (sweep1 * i) / points;
      this.graphics.lineTo(cx + Math.cos(angle) * R, cy + Math.sin(angle) * R);
    }

    // Arco 2: arco SINISTRO del Cerchio B (la parte dentro A, che crea la concavità)
    // Da punto intersezione basso, crescendo angolo, passando per π, fino a punto alto
    const target = bTop + 2 * Math.PI;
    const sweep2 = target - bBot;

    for (let i = 1; i <= points; i++) {
      const angle = bBot + (sweep2 * i) / points;
      this.graphics.lineTo((cx + d) + Math.cos(angle) * R, cy + Math.sin(angle) * R);
    }

    this.graphics.closePath();
  }

  private drawRing(width: number, height: number) {
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadiusX = width / 2;
    const outerRadiusY = height / 2;
    const innerRadiusX = outerRadiusX * 0.6;
    const innerRadiusY = outerRadiusY * 0.6;

    this.graphics.circle(centerX, centerY, outerRadiusX);
    this.graphics.fill(this._config.fillColor);
    this.graphics.stroke({ width: this._config.strokeWidth, color: this._config.strokeColor });

    this.graphics.circle(centerX, centerY, innerRadiusX);
    this.graphics.fill('#ffffff');
  }

  private drawRoundedRectangle(width: number, height: number) {
    const radius = Math.min(width, height) * 0.15;
    this.graphics.roundRect(0, 0, width, height, radius);
  }

  private drawPlus(width: number, height: number) {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseSize = Math.min(width, height);
    
    // Usa proporzioni basate sulla dimensione minima per mantenere simmetria
    const armWidth = baseSize * 0.3;    // larghezza di ogni braccio
    const armLength = baseSize * 0.65;  // lunghezza di ogni braccio

    // Disegna il perimetro della croce come un unico percorso chiuso
    // 12 vertici in senso orario partendo dal top-left
    const vertices = [
      { x: centerX - armWidth / 2, y: centerY - armLength / 2 },
      { x: centerX + armWidth / 2, y: centerY - armLength / 2 },
      { x: centerX + armWidth / 2, y: centerY - armWidth / 2 },
      { x: centerX + armLength / 2, y: centerY - armWidth / 2 },
      { x: centerX + armLength / 2, y: centerY + armWidth / 2 },
      { x: centerX + armWidth / 2, y: centerY + armWidth / 2 },
      { x: centerX + armWidth / 2, y: centerY + armLength / 2 },
      { x: centerX - armWidth / 2, y: centerY + armLength / 2 },
      { x: centerX - armWidth / 2, y: centerY + armWidth / 2 },
      { x: centerX - armLength / 2, y: centerY + armWidth / 2 },
      { x: centerX - armLength / 2, y: centerY - armWidth / 2 },
      { x: centerX - armWidth / 2, y: centerY - armWidth / 2 },
    ];

    this.graphics.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      this.graphics.lineTo(vertices[i].x, vertices[i].y);
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
      case 'cloud':
        this.drawCloud(shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'diamond':
        this.drawDiamond(shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'crescent':
        this.drawCrescent(shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'ring':
        this.drawRing(shapeWidth, shapeHeight);
        break;
      case 'roundedRectangle':
        this.drawRoundedRectangle(shapeWidth, shapeHeight);
        g.fill(fillColor);
        g.stroke({ width: strokeWidth, color: strokeColor });
        break;
      case 'plus':
        this.drawPlus(shapeWidth, shapeHeight);
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
