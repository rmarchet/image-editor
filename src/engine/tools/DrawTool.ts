import { Graphics } from 'pixi.js';
import type { BaseTool } from './BaseTool';
import type { EditorEngine } from '../core/EditorEngine';
import { useToolStore } from '../../stores/toolStore';
import { DrawingElement } from '../elements/DrawingElement';
import { AddElementCommand } from '../history/commands';
import { useHistoryStore } from '../../stores/historyStore';
import type { DrawingStrokeData } from '../../types';

export class DrawTool implements BaseTool {
  readonly name = 'draw';
  engine: EditorEngine;

  private isDrawing = false;
  private currentGraphics: Graphics | null = null;
  private lastPoint: { x: number; y: number } | null = null;
  private currentStroke: DrawingStrokeData | null = null;

  constructor(engine: EditorEngine) {
    this.engine = engine;
  }

  activate() {
    const canvas = this.engine.app.canvas as HTMLCanvasElement;
    canvas.style.cursor = 'crosshair';
  }

  deactivate() {
    this.finishStroke();
    const canvas = this.engine.app.canvas as HTMLCanvasElement;
    canvas.style.cursor = 'default';
  }

  onPointerDown(worldX: number, worldY: number) {
    const { brushColor, brushSize, brushOpacity } = useToolStore.getState().drawConfig;

    this.isDrawing = true;
    this.currentGraphics = new Graphics();
    this.currentGraphics.alpha = brushOpacity;
    this.engine.viewport.container.addChild(this.currentGraphics);

    this.lastPoint = { x: worldX, y: worldY };
    this.currentStroke = {
      color: brushColor,
      size: brushSize,
      opacity: brushOpacity,
      points: [{ x: worldX, y: worldY }],
    };

    this.currentGraphics.circle(worldX, worldY, brushSize / 2);
    this.currentGraphics.fill(brushColor);
  }

  onPointerMove(worldX: number, worldY: number) {
    if (!this.isDrawing || !this.currentGraphics || !this.lastPoint || !this.currentStroke) return;

    const { brushColor, brushSize } = useToolStore.getState().drawConfig;

    this.currentGraphics.moveTo(this.lastPoint.x, this.lastPoint.y);
    this.currentGraphics.lineTo(worldX, worldY);
    this.currentGraphics.stroke({ width: brushSize, color: brushColor });

    this.currentStroke.points.push({ x: worldX, y: worldY });
    this.lastPoint = { x: worldX, y: worldY };
  }

  onPointerUp() {
    this.finishStroke();
  }

  private finishStroke() {
    if (!this.isDrawing || !this.currentGraphics || !this.currentStroke) {
      this.isDrawing = false;
      return;
    }

    this.engine.viewport.container.removeChild(this.currentGraphics);

    const element = new DrawingElement([this.currentStroke]);
    useHistoryStore.getState().push(new AddElementCommand(element));

    this.isDrawing = false;
    this.currentGraphics = null;
    this.lastPoint = null;
    this.currentStroke = null;
  }
}
