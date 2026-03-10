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

interface TransformBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export class TransformController {
  private selection: SelectionManager;
  private viewport: Viewport;
  private mode: TransformMode = null;
  private startPointer = { x: 0, y: 0 };
  private startState: TransformSnapshot | null = null;
  private startBounds: TransformBounds | null = null;
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
      if (handle === 'rotate') {
        this.startBounds = null;
      } else {
        const bounds = this.targetElement.container.getBounds(false);
        const topLeft = this.viewport.screenToWorld(bounds.x, bounds.y);
        const bottomRight = this.viewport.screenToWorld(
          bounds.x + bounds.width,
          bounds.y + bounds.height
        );
        this.startBounds = {
          left: topLeft.x,
          top: topLeft.y,
          right: bottomRight.x,
          bottom: bottomRight.y,
        };
      }
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
      this.startBounds = null;
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

      case 'resize-se':
      case 'resize-nw':
      case 'resize-ne':
      case 'resize-sw': {
        if (!this.startBounds) {
          break;
        }

        const minSize = 20;
        const mode = this.mode;
        const startLeft = this.startBounds.left;
        const startTop = this.startBounds.top;
        const startRight = this.startBounds.right;
        const startBottom = this.startBounds.bottom;

        let newLeft = startLeft;
        let newTop = startTop;
        let newRight = startRight;
        let newBottom = startBottom;

        if (mode === 'resize-se') {
          newRight = Math.max(startLeft + minSize, startRight + dx);
          newBottom = Math.max(startTop + minSize, startBottom + dy);
        } else if (mode === 'resize-nw') {
          newLeft = Math.min(startRight - minSize, startLeft + dx);
          newTop = Math.min(startBottom - minSize, startTop + dy);
        } else if (mode === 'resize-ne') {
          newRight = Math.max(startLeft + minSize, startRight + dx);
          newTop = Math.min(startBottom - minSize, startTop + dy);
        } else if (mode === 'resize-sw') {
          newLeft = Math.min(startRight - minSize, startLeft + dx);
          newBottom = Math.max(startTop + minSize, startBottom + dy);
        }

        const newW = Math.max(minSize, newRight - newLeft);
        const newH = Math.max(minSize, newBottom - newTop);

        this.targetElement.width = newW;
        this.targetElement.height = newH;

        const nextPivotX = this.targetElement.container.pivot.x;
        const nextPivotY = this.targetElement.container.pivot.y;

        this.targetElement.x = newLeft + nextPivotX;
        this.targetElement.y = newTop + nextPivotY;

        // Final correction aligns the rendered top-left bound exactly to the intended anchor.
        const actualBounds = this.targetElement.container.getBounds(false);
        const actualTopLeft = this.viewport.screenToWorld(actualBounds.x, actualBounds.y);
        this.targetElement.x += newLeft - actualTopLeft.x;
        this.targetElement.y += newTop - actualTopLeft.y;
        break;
      }

      case 'rotate': {
        const localBounds = this.targetElement.container.getLocalBounds();
        const localCenter = {
          x: localBounds.x + localBounds.width / 2,
          y: localBounds.y + localBounds.height / 2,
        };
        const centerScreen = this.targetElement.container.toGlobal(localCenter);
        const centerWorld = this.viewport.screenToWorld(centerScreen.x, centerScreen.y);
        const angle =
          Math.atan2(worldY - centerWorld.y, worldX - centerWorld.x) * (180 / Math.PI) +
          90;
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
    this.startBounds = null;
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
