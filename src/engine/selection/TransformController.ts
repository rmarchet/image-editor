import { BaseElement } from '../elements/BaseElement';
import type { SelectionManager } from './SelectionManager';
import type { Viewport } from '../core/Viewport';

type ResizeMode = 'resize-nw' | 'resize-ne' | 'resize-se' | 'resize-sw';
type TransformMode = 'move' | ResizeMode | 'rotate' | null;
type CornerName = 'nw' | 'ne' | 'se' | 'sw';

interface WorldPoint {
  x: number;
  y: number;
}

interface TransformSnapshot {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface ResizeFrame {
  corners: Record<CornerName, WorldPoint>;
  axisX: WorldPoint;
  axisY: WorldPoint;
}

interface ResizeDimensions {
  width: number;
  height: number;
}

export class TransformController {
  private selection: SelectionManager;
  private viewport: Viewport;
  private mode: TransformMode = null;
  private startPointer = { x: 0, y: 0 };
  private startState: TransformSnapshot | null = null;
  private startResizeFrame: ResizeFrame | null = null;
  private rotateCenterWorld: { x: number; y: number } | null = null;
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
        this.startResizeFrame = null;
        this.rotateCenterWorld = this.getElementCenterWorld(this.targetElement);
      } else {
        this.rotateCenterWorld = null;
        this.startResizeFrame = this.captureResizeFrame(this.targetElement);
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
      this.startResizeFrame = null;
      this.rotateCenterWorld = null;
      this.onTransformStart?.(hit, this.startState);
      return true;
    }

    this.selection.deselectAll();
    return false;
  }

  handlePointerMove(worldX: number, worldY: number, keepAspectRatio = false) {
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
        this.applyResizeFromOrientedFrame(this.mode, worldX, worldY, keepAspectRatio);
        break;
      }

      case 'rotate': {
        if (!this.rotateCenterWorld) {
          break;
        }

        const angle =
          Math.atan2(worldY - this.rotateCenterWorld.y, worldX - this.rotateCenterWorld.x) *
            (180 / Math.PI) +
          90;
        this.targetElement.rotation = angle;
        this.alignElementCenterToWorld(this.targetElement, this.rotateCenterWorld);
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
    this.startResizeFrame = null;
    this.rotateCenterWorld = null;
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

  private getElementCenterWorld(el: BaseElement): { x: number; y: number } | null {
    const localBounds = el.container.getLocalBounds();
    if (localBounds.width <= 0 || localBounds.height <= 0) {
      return null;
    }

    const localCenter = {
      x: localBounds.x + localBounds.width / 2,
      y: localBounds.y + localBounds.height / 2,
    };
    const centerScreen = el.container.toGlobal(localCenter);
    return this.viewport.screenToWorld(centerScreen.x, centerScreen.y);
  }

  private alignElementCenterToWorld(el: BaseElement, targetCenter: { x: number; y: number }) {
    const currentCenter = this.getElementCenterWorld(el);
    if (!currentCenter) {
      return;
    }

    el.x += targetCenter.x - currentCenter.x;
    el.y += targetCenter.y - currentCenter.y;
  }

  private captureResizeFrame(el: BaseElement): ResizeFrame | null {
    const corners = this.getElementCornersWorld(el);
    if (!corners) {
      return null;
    }

    const topEdgeX = corners.ne.x - corners.nw.x;
    const topEdgeY = corners.ne.y - corners.nw.y;
    const leftEdgeX = corners.sw.x - corners.nw.x;
    const leftEdgeY = corners.sw.y - corners.nw.y;

    const topEdgeLength = Math.hypot(topEdgeX, topEdgeY);
    const leftEdgeLength = Math.hypot(leftEdgeX, leftEdgeY);
    if (topEdgeLength <= 0 || leftEdgeLength <= 0) {
      return null;
    }

    return {
      corners,
      axisX: {
        x: topEdgeX / topEdgeLength,
        y: topEdgeY / topEdgeLength,
      },
      axisY: {
        x: leftEdgeX / leftEdgeLength,
        y: leftEdgeY / leftEdgeLength,
      },
    };
  }

  private getElementCornersWorld(el: BaseElement): Record<CornerName, WorldPoint> | null {
    const localBounds = el.container.getLocalBounds();
    if (localBounds.width <= 0 || localBounds.height <= 0) {
      return null;
    }

    const nwScreen = el.container.toGlobal({ x: localBounds.x, y: localBounds.y });
    const neScreen = el.container.toGlobal({ x: localBounds.x + localBounds.width, y: localBounds.y });
    const seScreen = el.container.toGlobal({
      x: localBounds.x + localBounds.width,
      y: localBounds.y + localBounds.height,
    });
    const swScreen = el.container.toGlobal({ x: localBounds.x, y: localBounds.y + localBounds.height });

    return {
      nw: this.viewport.screenToWorld(nwScreen.x, nwScreen.y),
      ne: this.viewport.screenToWorld(neScreen.x, neScreen.y),
      se: this.viewport.screenToWorld(seScreen.x, seScreen.y),
      sw: this.viewport.screenToWorld(swScreen.x, swScreen.y),
    };
  }

  private getResizeAnchorConfig(mode: ResizeMode): {
    anchor: CornerName;
    signX: number;
    signY: number;
  } {
    switch (mode) {
      case 'resize-se':
        return { anchor: 'nw', signX: 1, signY: 1 };
      case 'resize-nw':
        return { anchor: 'se', signX: -1, signY: -1 };
      case 'resize-ne':
        return { anchor: 'sw', signX: 1, signY: -1 };
      case 'resize-sw':
        return { anchor: 'ne', signX: -1, signY: 1 };
    }
  }

  private applyResizeFromOrientedFrame(
    mode: ResizeMode,
    worldX: number,
    worldY: number,
    keepAspectRatio: boolean,
  ) {
    if (!this.startResizeFrame || !this.targetElement) {
      return;
    }

    const minSize = 20;
    const frame = this.startResizeFrame;
    const config = this.getResizeAnchorConfig(mode);
    const anchor = frame.corners[config.anchor];

    const deltaX = worldX - anchor.x;
    const deltaY = worldY - anchor.y;

    let newW = Math.max(
      minSize,
      config.signX * (deltaX * frame.axisX.x + deltaY * frame.axisX.y),
    );
    let newH = Math.max(
      minSize,
      config.signY * (deltaX * frame.axisY.x + deltaY * frame.axisY.y),
    );

    if (keepAspectRatio) {
      const constrained = this.constrainResizeToAspectRatio(newW, newH, minSize);
      newW = constrained.width;
      newH = constrained.height;
    }

    this.targetElement.width = newW;
    this.targetElement.height = newH;

    const updatedCorners = this.getElementCornersWorld(this.targetElement);
    if (!updatedCorners) {
      return;
    }

    const updatedAnchor = updatedCorners[config.anchor];
    this.targetElement.x += anchor.x - updatedAnchor.x;
    this.targetElement.y += anchor.y - updatedAnchor.y;
  }

  private constrainResizeToAspectRatio(
    proposedWidth: number,
    proposedHeight: number,
    minSize: number,
  ): ResizeDimensions {
    if (!this.startState) {
      return { width: proposedWidth, height: proposedHeight };
    }

    const startWidth = Math.max(1, this.startState.width);
    const startHeight = Math.max(1, this.startState.height);
    const aspectRatio = startWidth / startHeight;

    if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) {
      return { width: proposedWidth, height: proposedHeight };
    }

    const minWidth = Math.max(minSize, aspectRatio >= 1 ? minSize * aspectRatio : minSize);
    const minHeight = Math.max(minSize, aspectRatio >= 1 ? minSize : minSize / aspectRatio);

    const widthDriven: ResizeDimensions = {
      width: Math.max(minWidth, proposedWidth),
      height: 0,
    };
    widthDriven.height = Math.max(minHeight, widthDriven.width / aspectRatio);

    const heightDriven: ResizeDimensions = {
      width: 0,
      height: Math.max(minHeight, proposedHeight),
    };
    heightDriven.width = Math.max(minWidth, heightDriven.height * aspectRatio);

    const widthDrivenDelta = Math.abs(widthDriven.height - proposedHeight);
    const heightDrivenDelta = Math.abs(heightDriven.width - proposedWidth);

    return widthDrivenDelta <= heightDrivenDelta ? widthDriven : heightDriven;
  }
}
