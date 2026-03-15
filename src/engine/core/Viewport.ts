import { Container, type Application } from 'pixi.js';
import { useEditorStore } from '../../stores/editorStore';
import { shouldHandleEditorKeyboardEvent } from '../../embed/domEnvironment';

export class Viewport {
  readonly container: Container;
  private app: Application;
  private _zoom = 1;
  private _panX = 0;
  private _panY = 0;
  private isPanning = false;
  private lastPointer = { x: 0, y: 0 };
  private spaceDown = false;

  constructor(app: Application) {
    this.app = app;
    this.container = new Container();
    this.setupEvents();
  }

  get zoom() {
    return this._zoom;
  }

  get panX() {
    return this._panX;
  }

  get panY() {
    return this._panY;
  }

  private setupEvents() {
    const canvas = this.app.canvas as HTMLCanvasElement;

    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();

    if (e.altKey) {
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      this.setZoomAtCenter(this._zoom * factor);
      return;
    }

    const PAN_SPEED = 1;

    if (e.shiftKey) {
      const horizontalDelta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      this._panX -= horizontalDelta * PAN_SPEED;
      this.applyTransform();
      return;
    }

    this._panY -= e.deltaY * PAN_SPEED;
    this.applyTransform();
  };

  private onKeyDown = (e: KeyboardEvent) => {
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

    if (e.code === 'Space' && !this.spaceDown) {
      this.spaceDown = true;
      (this.app.canvas as HTMLCanvasElement).style.cursor = 'grab';
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      this.spaceDown = false;
      if (!this.isPanning) {
        (this.app.canvas as HTMLCanvasElement).style.cursor = 'default';
      }
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    (this.app.canvas as HTMLCanvasElement).focus({ preventScroll: true });

    if (e.button === 1 || (e.button === 0 && this.spaceDown)) {
      this.isPanning = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      (this.app.canvas as HTMLCanvasElement).style.cursor = 'grabbing';
      useEditorStore.getState().setIsPanning(true);
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.isPanning) return;
    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this._panX += dx;
    this._panY += dy;
    this.lastPointer = { x: e.clientX, y: e.clientY };
    this.applyTransform();
  };

  private onPointerUp = () => {
    if (this.isPanning) {
      this.isPanning = false;
      (this.app.canvas as HTMLCanvasElement).style.cursor = this.spaceDown
        ? 'grab'
        : 'default';
      useEditorStore.getState().setIsPanning(false);
    }
  };

  private applyTransform() {
    this.container.scale.set(this._zoom);
    this.container.position.set(this._panX, this._panY);
  }

  getCenterPoint() {
    const renderer = this.app?.renderer;
    if (!renderer) {
      return { x: 0, y: 0 };
    }

    return {
      x: renderer.width / 2,
      y: renderer.height / 2,
    };
  }

  setZoomAtCenter(zoom: number) {
    const center = this.getCenterPoint();
    this.setZoom(zoom, center.x, center.y);
  }

  setZoom(zoom: number, pivotX?: number, pivotY?: number) {
    const newZoom = Math.max(0.05, Math.min(20, zoom));

    if (pivotX !== undefined && pivotY !== undefined) {
      const worldX = (pivotX - this._panX) / this._zoom;
      const worldY = (pivotY - this._panY) / this._zoom;
      this._panX = pivotX - worldX * newZoom;
      this._panY = pivotY - worldY * newZoom;
    }

    this._zoom = newZoom;
    this.applyTransform();
    useEditorStore.getState().setZoom(newZoom);
  }

  fitContent(contentWidth: number, contentHeight: number) {
    const renderer = this.app?.renderer;
    if (!renderer) return;
    const rendererWidth = renderer.width;
    const rendererHeight = renderer.height;
    const padding = 60;

    const scaleX = (rendererWidth - padding * 2) / contentWidth;
    const scaleY = (rendererHeight - padding * 2) / contentHeight;
    const zoom = Math.min(scaleX, scaleY, 2);

    this._zoom = zoom;
    this._panX = (rendererWidth - contentWidth * zoom) / 2;
    this._panY = (rendererHeight - contentHeight * zoom) / 2;

    this.applyTransform();
    useEditorStore.getState().setZoom(zoom);
  }

  screenToWorld(screenX: number, screenY: number) {
    return {
      x: (screenX - this._panX) / this._zoom,
      y: (screenY - this._panY) / this._zoom,
    };
  }

  worldToScreen(worldX: number, worldY: number) {
    return {
      x: worldX * this._zoom + this._panX,
      y: worldY * this._zoom + this._panY,
    };
  }

  destroy() {
    const canvas = this.app.canvas as HTMLCanvasElement;
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
