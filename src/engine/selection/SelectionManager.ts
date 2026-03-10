import { Graphics, type Container } from 'pixi.js';
import { BaseElement } from '../elements/BaseElement';
import { useElementStore } from '../../stores/elementStore';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = 0x7c3aed;
const BORDER_COLOR = 0x7c3aed;
const ROTATION_HANDLE_OFFSET = 25;

export class SelectionManager {
  private overlay: Graphics;
  private selectedElements: BaseElement[] = [];
  private allElements: BaseElement[] = [];

  constructor(overlayContainer: Container) {
    this.overlay = new Graphics();
    this.overlay.eventMode = 'none';
    overlayContainer.addChild(this.overlay);
  }

  setElements(elements: BaseElement[]) {
    this.allElements = elements;
  }

  select(element: BaseElement, additive = false) {
    if (element.locked) return;

    if (additive) {
      const idx = this.selectedElements.indexOf(element);
      if (idx >= 0) {
        this.selectedElements.splice(idx, 1);
      } else {
        this.selectedElements.push(element);
      }
    } else {
      this.selectedElements = [element];
    }

    this.syncToStore();
    this.drawOverlay();
  }

  selectById(id: string, additive = false) {
    const element = this.allElements.find((el) => el.id === id);
    if (element) this.select(element, additive);
  }

  deselectAll() {
    this.selectedElements = [];
    this.syncToStore();
    this.drawOverlay();
  }

  /** Remove elements by id from selection (e.g. after they are deleted). */
  removeFromSelection(ids: string[]) {
    const set = new Set(ids);
    this.selectedElements = this.selectedElements.filter((el) => !set.has(el.id));
    this.syncToStore();
    this.drawOverlay();
  }

  getSelected(): BaseElement[] {
    return [...this.selectedElements];
  }

  getSelectedSingle(): BaseElement | null {
    return this.selectedElements.length === 1 ? this.selectedElements[0] : null;
  }

  isSelected(element: BaseElement): boolean {
    return this.selectedElements.includes(element);
  }

  /** Hit test using screen (canvas) coordinates; getBounds() returns stage/canvas space. */
  hitTest(screenX: number, screenY: number): BaseElement | null {
    for (let i = this.allElements.length - 1; i >= 0; i--) {
      const el = this.allElements[i];
      if (!el.visible || el.locked) continue;

      const bounds = el.container.getBounds(false);
      if (
        bounds.width > 0 &&
        bounds.height > 0 &&
        screenX >= bounds.x &&
        screenX <= bounds.x + bounds.width &&
        screenY >= bounds.y &&
        screenY <= bounds.y + bounds.height
      ) {
        return el;
      }
    }
    return null;
  }

  hitTestHandle(
    screenX: number,
    screenY: number,
    zoom: number
  ): string | null {
    if (this.selectedElements.length !== 1) return null;
    const el = this.selectedElements[0];
    const bounds = el.container.getBounds(false);

    const handleSize = HANDLE_SIZE / zoom;
    const corners = [
      { name: 'nw', x: bounds.x, y: bounds.y },
      { name: 'ne', x: bounds.x + bounds.width, y: bounds.y },
      { name: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      { name: 'sw', x: bounds.x, y: bounds.y + bounds.height },
    ];

    for (const corner of corners) {
      if (
        Math.abs(screenX - corner.x) <= handleSize &&
        Math.abs(screenY - corner.y) <= handleSize
      ) {
        return corner.name;
      }
    }

    const rotHandleX = bounds.x + bounds.width / 2;
    const rotHandleY = bounds.y - ROTATION_HANDLE_OFFSET / zoom;
    if (
      Math.abs(screenX - rotHandleX) <= handleSize &&
      Math.abs(screenY - rotHandleY) <= handleSize
    ) {
      return 'rotate';
    }

    return null;
  }

  drawOverlay(zoom = 1) {
    this.overlay.clear();

    const stillSelected = this.selectedElements.filter((el) =>
      this.allElements.includes(el)
    );
    if (stillSelected.length !== this.selectedElements.length) {
      this.selectedElements = stillSelected;
      this.syncToStore();
    }

    for (const el of this.selectedElements) {
      if (!this.allElements.includes(el)) continue;
      try {
        const bounds = el.container.getBounds(false);
        const lineWidth = 1.5 / zoom;
        const handleSize = HANDLE_SIZE / zoom;

        this.overlay.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        this.overlay.stroke({ width: lineWidth, color: BORDER_COLOR });

        const corners = [
          { x: bounds.x, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          { x: bounds.x, y: bounds.y + bounds.height },
        ];

        for (const c of corners) {
          this.overlay.rect(
            c.x - handleSize / 2,
            c.y - handleSize / 2,
            handleSize,
            handleSize
          );
          this.overlay.fill(0xffffff);
          this.overlay.stroke({ width: lineWidth, color: HANDLE_COLOR });
        }

        if (this.selectedElements.length === 1) {
          const cx = bounds.x + bounds.width / 2;
          const topY = bounds.y;
          const rotY = topY - ROTATION_HANDLE_OFFSET / zoom;

          this.overlay.moveTo(cx, topY);
          this.overlay.lineTo(cx, rotY);
          this.overlay.stroke({ width: lineWidth, color: BORDER_COLOR });

          this.overlay.circle(cx, rotY, handleSize / 2);
          this.overlay.fill(0xffffff);
          this.overlay.stroke({ width: lineWidth, color: HANDLE_COLOR });
        }
      } catch {
        // Element may be destroyed (e.g. after delete); skip drawing
      }
    }
  }

  private syncToStore() {
    useElementStore
      .getState()
      .setSelectedIds(this.selectedElements.map((el) => el.id));
  }

  destroy() {
    this.overlay.destroy();
  }
}
