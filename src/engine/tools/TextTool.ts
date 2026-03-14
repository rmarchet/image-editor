import type { BaseTool } from './BaseTool';
import type { EditorEngine } from '../core/EditorEngine';
import { TextElement } from '../elements/TextElement';
import { useToolStore } from '../../stores/toolStore';
import { AddElementCommand } from '../history/commands';
import { useHistoryStore } from '../../stores/historyStore';

export class TextTool implements BaseTool {
  readonly name = 'text';
  engine: EditorEngine;

  constructor(engine: EditorEngine) {
    this.engine = engine;
  }

  activate() {
    const canvas = this.engine.app.canvas as HTMLCanvasElement;
    canvas.style.cursor = 'text';
  }

  deactivate() {
    const canvas = this.engine.app.canvas as HTMLCanvasElement;
    canvas.style.cursor = 'default';
  }

  onPointerDown(worldX: number, worldY: number) {
    const element = new TextElement({ text: 'Edit me' });
    element.x = worldX;
    element.y = worldY;
    useHistoryStore.getState().push(new AddElementCommand(element));
    this.engine.selection.select(element);

    useToolStore.getState().setActiveTool('select');
  }
}
