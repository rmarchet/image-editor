import { Graphics, Container, RenderTexture, Sprite, Rectangle } from 'pixi.js';
import type { BaseTool } from './BaseTool';
import type { EditorEngine } from '../core/EditorEngine';
import { ImageElement } from '../elements/ImageElement';
import { useToolStore } from '../../stores/toolStore';

export class CropTool implements BaseTool {
  readonly name = 'crop';
  engine: EditorEngine;

  private overlay: Graphics | null = null;
  private cropRect = { x: 0, y: 0, width: 200, height: 150 };
  private isDragging = false;
  private isResizing = false;
  private resizeHandle = '';
  private dragStart = { x: 0, y: 0 };
  private rectStart = { x: 0, y: 0, width: 0, height: 0 };
  private targetElement: ImageElement | null = null;

  constructor(engine: EditorEngine) {
    this.engine = engine;
  }

  activate() {
    const selected = this.engine.selection.getSelectedSingle();
    if (!(selected instanceof ImageElement)) {
      useToolStore.getState().setActiveTool('select');
      return;
    }

    this.targetElement = selected;
    useToolStore.getState().setIsCropping(true);

    const bounds = selected.container.getBounds();
    this.cropRect = {
      x: bounds.x + bounds.width * 0.1,
      y: bounds.y + bounds.height * 0.1,
      width: bounds.width * 0.8,
      height: bounds.height * 0.8,
    };

    this.overlay = new Graphics();
    this.engine.app.stage.addChild(this.overlay);
    this.drawOverlay();
  }

  deactivate() {
    if (this.overlay) {
      this.engine.app.stage.removeChild(this.overlay);
      this.overlay.destroy();
      this.overlay = null;
    }
    this.targetElement = null;
    useToolStore.getState().setIsCropping(false);
  }

  private drawOverlay() {
    if (!this.overlay) return;
    this.overlay.clear();

    const zoom = this.engine.viewport.zoom;
    const { x, y, width, height } = this.cropRect;

    const screenRect = {
      x: x * zoom + this.engine.viewport.panX,
      y: y * zoom + this.engine.viewport.panY,
      width: width * zoom,
      height: height * zoom,
    };

    this.overlay.rect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
    this.overlay.stroke({ width: 2, color: 0x7c3aed });

    this.overlay.rect(screenRect.x, screenRect.y, screenRect.width, screenRect.height);
    this.overlay.fill({ color: 0x7c3aed, alpha: 0.08 });

    const hs = 6;
    const corners = [
      { x: screenRect.x, y: screenRect.y },
      { x: screenRect.x + screenRect.width, y: screenRect.y },
      { x: screenRect.x + screenRect.width, y: screenRect.y + screenRect.height },
      { x: screenRect.x, y: screenRect.y + screenRect.height },
    ];

    for (const c of corners) {
      this.overlay.rect(c.x - hs / 2, c.y - hs / 2, hs, hs);
      this.overlay.fill(0xffffff);
      this.overlay.stroke({ width: 1.5, color: 0x7c3aed });
    }
  }

  onPointerDown(worldX: number, worldY: number) {
    const { x, y, width, height } = this.cropRect;
    const margin = 8 / this.engine.viewport.zoom;

    const corners = [
      { name: 'nw', cx: x, cy: y },
      { name: 'ne', cx: x + width, cy: y },
      { name: 'se', cx: x + width, cy: y + height },
      { name: 'sw', cx: x, cy: y + height },
    ];

    for (const c of corners) {
      if (Math.abs(worldX - c.cx) < margin && Math.abs(worldY - c.cy) < margin) {
        this.isResizing = true;
        this.resizeHandle = c.name;
        this.dragStart = { x: worldX, y: worldY };
        this.rectStart = { ...this.cropRect };
        return;
      }
    }

    if (worldX >= x && worldX <= x + width && worldY >= y && worldY <= y + height) {
      this.isDragging = true;
      this.dragStart = { x: worldX, y: worldY };
      this.rectStart = { ...this.cropRect };
    }
  }

  onPointerMove(worldX: number, worldY: number) {
    if (this.isDragging) {
      const dx = worldX - this.dragStart.x;
      const dy = worldY - this.dragStart.y;
      this.cropRect.x = this.rectStart.x + dx;
      this.cropRect.y = this.rectStart.y + dy;
      this.drawOverlay();
    } else if (this.isResizing) {
      const dx = worldX - this.dragStart.x;
      const dy = worldY - this.dragStart.y;

      switch (this.resizeHandle) {
        case 'se':
          this.cropRect.width = Math.max(20, this.rectStart.width + dx);
          this.cropRect.height = Math.max(20, this.rectStart.height + dy);
          break;
        case 'nw':
          this.cropRect.x = this.rectStart.x + dx;
          this.cropRect.y = this.rectStart.y + dy;
          this.cropRect.width = Math.max(20, this.rectStart.width - dx);
          this.cropRect.height = Math.max(20, this.rectStart.height - dy);
          break;
        case 'ne':
          this.cropRect.y = this.rectStart.y + dy;
          this.cropRect.width = Math.max(20, this.rectStart.width + dx);
          this.cropRect.height = Math.max(20, this.rectStart.height - dy);
          break;
        case 'sw':
          this.cropRect.x = this.rectStart.x + dx;
          this.cropRect.width = Math.max(20, this.rectStart.width - dx);
          this.cropRect.height = Math.max(20, this.rectStart.height + dy);
          break;
      }
      this.drawOverlay();
    }
  }

  onPointerUp() {
    this.isDragging = false;
    this.isResizing = false;
  }

  applyCrop() {
    if (!this.targetElement) return;

    const renderer = this.engine.app.renderer;
    const { x, y, width, height } = this.cropRect;

    const elemBounds = this.targetElement.container.getBounds();
    const localX = x - elemBounds.x;
    const localY = y - elemBounds.y;

    const frame = new Rectangle(localX, localY, width, height);
    const rt = RenderTexture.create({ width, height });

    const tempContainer = new Container();
    tempContainer.addChild(this.targetElement.container);
    tempContainer.x = -localX;
    tempContainer.y = -localY;

    renderer.render({ container: tempContainer, target: rt });

    this.engine.viewport.container.addChild(this.targetElement.container);
    this.targetElement.container.position.set(x + width / 2, y + height / 2);
    this.targetElement.setTexture(rt);
    const croppedCanvas = renderer.extract.canvas(rt) as HTMLCanvasElement;
    this.targetElement.setSourceUrl(croppedCanvas.toDataURL('image/png'));

    useToolStore.getState().setActiveTool('select');
  }

  cancelCrop() {
    useToolStore.getState().setActiveTool('select');
  }
}
