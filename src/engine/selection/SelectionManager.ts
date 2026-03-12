import { Graphics, type Container } from 'pixi.js';
import { BaseElement } from '../elements/BaseElement';
import { useElementStore } from '../../stores/elementStore';

const HANDLE_SIZE = 8;
const HANDLE_COLOR = 0x7c3aed;
const BORDER_COLOR = 0x7c3aed;
const ROTATION_HANDLE_OFFSET = 25;

type CornerName = 'nw' | 'ne' | 'se' | 'sw';

interface OrientedFrame {
  corners: Record<CornerName, { x: number; y: number }>;
  topMid: { x: number; y: number };
  center: { x: number; y: number };
  rotationHandle: { x: number; y: number };
}

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
    const frame = this.getOrientedFrame(el, zoom);
    if (!frame) return null;

    const handleSize = HANDLE_SIZE;
    const corners = [
      { name: 'nw', ...frame.corners.nw },
      { name: 'ne', ...frame.corners.ne },
      { name: 'se', ...frame.corners.se },
      { name: 'sw', ...frame.corners.sw },
    ] as const;

    for (const corner of corners) {
      if (
        Math.abs(screenX - corner.x) <= handleSize &&
        Math.abs(screenY - corner.y) <= handleSize
      ) {
        return corner.name;
      }
    }

    if (
      Math.abs(screenX - frame.rotationHandle.x) <= handleSize &&
      Math.abs(screenY - frame.rotationHandle.y) <= handleSize
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
        const frame = this.getOrientedFrame(el, zoom);
        if (!frame) continue;

        const lineWidth = 1.5;
        const handleSize = HANDLE_SIZE;

        this.overlay.moveTo(frame.corners.nw.x, frame.corners.nw.y);
        this.overlay.lineTo(frame.corners.ne.x, frame.corners.ne.y);
        this.overlay.lineTo(frame.corners.se.x, frame.corners.se.y);
        this.overlay.lineTo(frame.corners.sw.x, frame.corners.sw.y);
        this.overlay.lineTo(frame.corners.nw.x, frame.corners.nw.y);
        this.overlay.stroke({ width: lineWidth, color: BORDER_COLOR });

        const corners = [
          frame.corners.nw,
          frame.corners.ne,
          frame.corners.se,
          frame.corners.sw,
        ];

        const topEdgeX = frame.corners.ne.x - frame.corners.nw.x;
        const topEdgeY = frame.corners.ne.y - frame.corners.nw.y;
        const topEdgeLength = Math.hypot(topEdgeX, topEdgeY) || 1;
        const axisX = {
          x: topEdgeX / topEdgeLength,
          y: topEdgeY / topEdgeLength,
        };

        const leftEdgeX = frame.corners.sw.x - frame.corners.nw.x;
        const leftEdgeY = frame.corners.sw.y - frame.corners.nw.y;
        const leftEdgeLength = Math.hypot(leftEdgeX, leftEdgeY) || 1;
        const axisY = {
          x: leftEdgeX / leftEdgeLength,
          y: leftEdgeY / leftEdgeLength,
        };

        for (const c of corners) {
          this.drawOrientedHandle(c, axisX, axisY, handleSize, lineWidth);
        }

        if (this.selectedElements.length === 1) {
          this.overlay.moveTo(frame.topMid.x, frame.topMid.y);
          this.overlay.lineTo(frame.rotationHandle.x, frame.rotationHandle.y);
          this.overlay.stroke({ width: lineWidth, color: BORDER_COLOR });

          this.overlay.circle(frame.rotationHandle.x, frame.rotationHandle.y, handleSize / 2);
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

  private drawOrientedHandle(
    center: { x: number; y: number },
    axisX: { x: number; y: number },
    axisY: { x: number; y: number },
    size: number,
    lineWidth: number
  ) {
    const half = size / 2;

    const p1 = {
      x: center.x - axisX.x * half - axisY.x * half,
      y: center.y - axisX.y * half - axisY.y * half,
    };
    const p2 = {
      x: center.x + axisX.x * half - axisY.x * half,
      y: center.y + axisX.y * half - axisY.y * half,
    };
    const p3 = {
      x: center.x + axisX.x * half + axisY.x * half,
      y: center.y + axisX.y * half + axisY.y * half,
    };
    const p4 = {
      x: center.x - axisX.x * half + axisY.x * half,
      y: center.y - axisX.y * half + axisY.y * half,
    };

    this.overlay.moveTo(p1.x, p1.y);
    this.overlay.lineTo(p2.x, p2.y);
    this.overlay.lineTo(p3.x, p3.y);
    this.overlay.lineTo(p4.x, p4.y);
    this.overlay.lineTo(p1.x, p1.y);
    this.overlay.fill(0xffffff);
    this.overlay.stroke({ width: lineWidth, color: HANDLE_COLOR });
  }

  private getOrientedFrame(el: BaseElement, zoom: number): OrientedFrame | null {
    const localBounds = el.container.getLocalBounds();
    if (localBounds.width <= 0 || localBounds.height <= 0) return null;

    const nw = el.container.toGlobal({ x: localBounds.x, y: localBounds.y });
    const ne = el.container.toGlobal({
      x: localBounds.x + localBounds.width,
      y: localBounds.y,
    });
    const se = el.container.toGlobal({
      x: localBounds.x + localBounds.width,
      y: localBounds.y + localBounds.height,
    });
    const sw = el.container.toGlobal({
      x: localBounds.x,
      y: localBounds.y + localBounds.height,
    });

    const topMid = {
      x: (nw.x + ne.x) / 2,
      y: (nw.y + ne.y) / 2,
    };

    const center = {
      x: (nw.x + se.x) / 2,
      y: (nw.y + se.y) / 2,
    };

    const edgeX = ne.x - nw.x;
    const edgeY = ne.y - nw.y;
    const edgeLength = Math.hypot(edgeX, edgeY) || 1;

    let normalX = -edgeY / edgeLength;
    let normalY = edgeX / edgeLength;

    const toCenterX = center.x - topMid.x;
    const toCenterY = center.y - topMid.y;
    if (normalX * toCenterX + normalY * toCenterY > 0) {
      normalX *= -1;
      normalY *= -1;
    }

    const rotationHandle = {
      x: topMid.x + normalX * ROTATION_HANDLE_OFFSET,
      y: topMid.y + normalY * ROTATION_HANDLE_OFFSET,
    };

    return {
      corners: { nw, ne, se, sw },
      topMid,
      center,
      rotationHandle,
    };
  }
}
