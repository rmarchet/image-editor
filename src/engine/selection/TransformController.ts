import { BaseElement } from '../elements/BaseElement';
import type { SelectionManager } from './SelectionManager';
import type { Viewport } from '../core/Viewport';

type TransformMode = 'move' | 'resize-nw' | 'resize-ne' | 'resize-se' | 'resize-sw' | 'rotate' | null;

interface TransformSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export class TransformController {
  private selection: SelectionManager;
  private viewport: Viewport;
  private mode: TransformMode = null;
  private startPointer = { x: 0, y: 0 };
  private startState: TransformSnapshot | null = null;
  private targetElement: BaseElement | null = null;

  onTransformStart?: (element: BaseElement, snapshot: TransformSnapshot) => void;
  onTransformEnd?: (element: BaseElement, before: TransformSnapshot, after: TransformSnapshot) => void;

  constructor(selection: SelectionManager, viewport: Viewport) {
    this.selection = selection;
    this.viewport = viewport;
  }

  handlePointerDown(worldX: number, worldY: number, shiftKey: boolean): boolean {
    const screen = this.viewport.worldToScreen(worldX, worldY);
    const handle = this.selection.hitTestHandle(screen.x, screen.y, this.viewport.zoom);

    if (handle) {
      this.targetElement = this.selection.getSelectedSingle();
      if (!this.targetElement) return false;

      this.mode = handle === 'rotate' ? 'rotate' : `resize-${handle}` as TransformMode;
      this.startPointer = { x: worldX, y: worldY };
      this.startState = this.captureState(this.targetElement);
      this.onTransformStart?.(this.targetElement, this.startState);
      return true;
    }

    const hit = this.selection.hitTest(screen.x, screen.y);
    if (hit) {
      this.selection.select(hit, shiftKey);
      this.targetElement = hit;
      this.mode = 'move';
      this.startPointer = { x: worldX, y: worldY };
      this.startState = this.captureState(hit);
      this.onTransformStart?.(hit, this.startState);
      return true;
    }

    this.selection.deselectAll();
    return false;
  }

  handlePointerMove(worldX: number, worldY: number) {
    if (!this.mode || !this.targetElement || !this.startState) return;

    const dx = worldX - this.startPointer.x;
    const dy = worldY - this.startPointer.y;

    switch (this.mode) {
      case 'move':
        this.targetElement.x = this.startState.x + dx;
        this.targetElement.y = this.startState.y + dy;
        break;

      case 'resize-se': {
        const newW = Math.max(20, this.startState.width + dx);
        const newH = Math.max(20, this.startState.height + dy);
        this.targetElement.width = newW;
        this.targetElement.height = newH;
        break;
      }

      case 'resize-nw': {
        const newW = Math.max(20, this.startState.width - dx);
        const newH = Math.max(20, this.startState.height - dy);
        this.targetElement.width = newW;
        this.targetElement.height = newH;
        this.targetElement.x = this.startState.x + dx;
        this.targetElement.y = this.startState.y + dy;
        break;
      }

      case 'resize-ne': {
        const newW = Math.max(20, this.startState.width + dx);
        const newH = Math.max(20, this.startState.height - dy);
        this.targetElement.width = newW;
        this.targetElement.height = newH;
        this.targetElement.y = this.startState.y + dy;
        break;
      }

      case 'resize-sw': {
        const newW = Math.max(20, this.startState.width - dx);
        const newH = Math.max(20, this.startState.height + dy);
        this.targetElement.width = newW;
        this.targetElement.height = newH;
        this.targetElement.x = this.startState.x + dx;
        break;
      }

      case 'rotate': {
        const bounds = this.targetElement.container.getBounds();
        const cx = bounds.x + bounds.width / 2;
        const cy = bounds.y + bounds.height / 2;
        const angle = Math.atan2(worldY - cy, worldX - cx) * (180 / Math.PI) + 90;
        this.targetElement.rotation = angle;
        break;
      }
    }

    this.selection.drawOverlay(this.viewport.zoom);
  }

  handlePointerUp() {
    if (this.mode && this.targetElement && this.startState) {
      const after = this.captureState(this.targetElement);
      this.onTransformEnd?.(this.targetElement, this.startState, after);
    }
    this.mode = null;
    this.targetElement = null;
    this.startState = null;
  }

  get isTransforming() {
    return this.mode !== null;
  }

  private captureState(el: BaseElement): TransformSnapshot {
    return {
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
    };
  }
}
