import type { BaseTool } from './BaseTool';
import type { EditorEngine } from '../core/EditorEngine';
import { ShapeElement } from '../elements/ShapeElement';
import { useToolStore } from '../../stores/toolStore';
import { AddElementCommand } from '../history/commands';
import { useHistoryStore } from '../../stores/historyStore';

export class ShapeTool implements BaseTool {
  readonly name = 'shape';
  engine: EditorEngine;

  private startPoint: { x: number; y: number } | null = null;
  private activeElement: ShapeElement | null = null;

  constructor(engine: EditorEngine) {
    this.engine = engine;
  }

  activate() {
    const canvas = this.engine.app.canvas as HTMLCanvasElement;
    canvas.style.cursor = 'crosshair';
  }

  deactivate() {
    this.startPoint = null;
    this.activeElement = null;
    const canvas = this.engine.app.canvas as HTMLCanvasElement;
    canvas.style.cursor = 'default';
  }

  onPointerDown(worldX: number, worldY: number) {
    const { shapeConfig } = useToolStore.getState();

    this.startPoint = { x: worldX, y: worldY };
    this.activeElement = new ShapeElement({
      shapeType: shapeConfig.shapeType,
      fillColor: shapeConfig.fillColor,
      strokeColor: shapeConfig.strokeColor,
      strokeWidth: shapeConfig.strokeWidth,
      shapeWidth: 1,
      shapeHeight: 1,
    });

    this.activeElement.x = worldX;
    this.activeElement.y = worldY;
    this.engine.addElement(this.activeElement);
  }

  onPointerMove(worldX: number, worldY: number) {
    if (!this.startPoint || !this.activeElement) return;

    const width = Math.abs(worldX - this.startPoint.x);
    const height = Math.abs(worldY - this.startPoint.y);

    if (width > 2 || height > 2) {
      this.activeElement.width = Math.max(10, width);
      this.activeElement.height = Math.max(10, height);

      this.activeElement.x = Math.min(this.startPoint.x, worldX) + width / 2;
      this.activeElement.y = Math.min(this.startPoint.y, worldY) + height / 2;
    }
  }

  onPointerUp() {
    if (this.activeElement) {
      if (this.activeElement.width < 10 && this.activeElement.height < 10) {
        this.activeElement.width = 200;
        this.activeElement.height = 150;
      }
      const element = this.activeElement;
      this.engine.selection.select(element);
      this.engine.syncElementsToStore();
      useHistoryStore.getState().record(new AddElementCommand(element));
    }

    this.startPoint = null;
    this.activeElement = null;

    useToolStore.getState().setActiveTool('select');
  }
}
