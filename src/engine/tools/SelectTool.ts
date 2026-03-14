import type { BaseTool } from './BaseTool';
import type { EditorEngine } from '../core/EditorEngine';
import { TextElement } from '../elements/TextElement';
import { useTextEditStore } from '../../stores/textEditStore';
import { TransformCommand } from '../history/commands';
import { useHistoryStore } from '../../stores/historyStore';

export class SelectTool implements BaseTool {
  readonly name = 'select';
  engine: EditorEngine;

  constructor(engine: EditorEngine) {
    this.engine = engine;

    engine.transform.onTransformEnd = (el, before, after) => {
      const changed =
        before.x !== after.x ||
        before.y !== after.y ||
        before.width !== after.width ||
        before.height !== after.height ||
        before.rotation !== after.rotation;
      if (changed) {
        useHistoryStore.getState().record(new TransformCommand(el.id, before, after));
      }
    };
  }

  activate() {
    const canvas = this.engine.app.canvas as HTMLCanvasElement;
    canvas.style.cursor = 'default';
  }

  deactivate() {
    this.engine.selection.deselectAll();
  }

  onPointerDown(worldX: number, worldY: number, event: PointerEvent) {
    this.engine.transform.handlePointerDown(worldX, worldY, event.shiftKey);
  }

  onDoubleClick(worldX: number, worldY: number, event: MouseEvent) {
    const screen = this.engine.viewport.worldToScreen(worldX, worldY);
    const hit = this.engine.selection.hitTest(screen.x, screen.y);

    if (!(hit instanceof TextElement)) {
      return;
    }

    this.engine.selection.select(hit, event.shiftKey);
    useTextEditStore.getState().startSession(hit.id, hit.text);
  }

  onPointerMove(worldX: number, worldY: number, event: PointerEvent) {
    this.engine.transform.handlePointerMove(worldX, worldY, event.shiftKey);
  }

  onPointerUp() {
    this.engine.transform.handlePointerUp();
    this.engine.syncElementsToStore();
  }

  onKeyDown(event: KeyboardEvent) {
    if (useTextEditStore.getState().activeElementId) {
      return;
    }
    // Delete/Backspace is handled globally by shortcuts.ts
  }
}
