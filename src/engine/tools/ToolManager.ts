import type { BaseTool } from './BaseTool';
import type { EditorEngine } from '../core/EditorEngine';
import { SelectTool } from './SelectTool';
import { CropTool } from './CropTool';
import { DrawTool } from './DrawTool';
import { TextTool } from './TextTool';
import { ShapeTool } from './ShapeTool';
import { useToolStore } from '../../stores/toolStore';
import { useEditorStore } from '../../stores/editorStore';
import type { ToolType } from '../../types';
import { isToolEnabled } from '../../embed/config';
import { shouldHandleEditorKeyboardEvent } from '../../embed/domEnvironment';

export class ToolManager {
  private tools: Map<ToolType, BaseTool> = new Map();
  private activeTool: BaseTool | null = null;
  private engine: EditorEngine;
  private unsubscribe: (() => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(engine: EditorEngine) {
    this.engine = engine;

    this.tools.set('select', new SelectTool(engine));
    this.tools.set('crop', new CropTool(engine));
    this.tools.set('draw', new DrawTool(engine));
    this.tools.set('text', new TextTool(engine));
    this.tools.set('shape', new ShapeTool(engine));

    this.keyHandler = (e: KeyboardEvent) => {
      if (!shouldHandleEditorKeyboardEvent(e)) {
        return;
      }

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      this.activeTool?.onKeyDown?.(e);
    };
    window.addEventListener('keydown', this.keyHandler);

    let prevTool = useToolStore.getState().activeTool;
    this.switchTool(prevTool);

    this.unsubscribe = useToolStore.subscribe((state) => {
      if (state.activeTool !== prevTool) {
        prevTool = state.activeTool;
        this.switchTool(state.activeTool);
      }
    });

    this.setupPointerEvents();
  }

  private setupPointerEvents() {
    const canvas = this.engine.app.canvas as HTMLCanvasElement;

    canvas.addEventListener('pointerdown', (e) => {
      canvas.focus({ preventScroll: true });

      const isPanning = useEditorStore.getState().isPanning;
      if (e.button === 1 || isPanning) return;

      const rect = canvas.getBoundingClientRect();
      const world = this.engine.viewport.screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      this.activeTool?.onPointerDown?.(world.x, world.y, e);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!this.activeTool?.onPointerMove) return;
      const rect = canvas.getBoundingClientRect();
      const world = this.engine.viewport.screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      this.activeTool.onPointerMove(world.x, world.y, e);
    });

    canvas.addEventListener('pointerup', (e) => {
      if (!this.activeTool?.onPointerUp) return;
      const rect = canvas.getBoundingClientRect();
      const world = this.engine.viewport.screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      this.activeTool.onPointerUp(world.x, world.y, e);
    });

    canvas.addEventListener('dblclick', (e) => {
      if (!this.activeTool?.onDoubleClick) return;

      const isPanning = useEditorStore.getState().isPanning;
      if (isPanning) return;

      const rect = canvas.getBoundingClientRect();
      const world = this.engine.viewport.screenToWorld(
        e.clientX - rect.left,
        e.clientY - rect.top
      );
      this.activeTool.onDoubleClick(world.x, world.y, e);
    });
  }

  private switchTool(toolType: ToolType) {
    if (!isToolEnabled(toolType)) {
      if (toolType !== 'select') {
        useToolStore.getState().setActiveTool('select');
      }
      toolType = 'select';
    }

    if (this.activeTool) {
      this.activeTool.deactivate();
    }

    this.activeTool = this.tools.get(toolType) ?? null;

    if (this.activeTool) {
      this.activeTool.activate();
    }
  }

  getTool<T extends BaseTool>(type: ToolType): T | undefined {
    return this.tools.get(type) as T | undefined;
  }

  destroy() {
    this.activeTool?.deactivate();
    this.unsubscribe?.();
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
    }
  }
}
