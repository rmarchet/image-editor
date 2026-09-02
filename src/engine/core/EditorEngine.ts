import { Application, BlurFilter, Container, Graphics } from 'pixi.js';
import { Viewport } from './Viewport';
import { SelectionManager } from '../selection/SelectionManager';
import { TransformController } from '../selection/TransformController';
import { ToolManager } from '../tools/ToolManager';
import { BaseElement } from '../elements/BaseElement';
import { useEditorStore } from '../../stores/editorStore';
import { useElementStore } from '../../stores/elementStore';

export class EditorEngine {
  private static instance: EditorEngine | null = null;

  app!: Application;
  viewport!: Viewport;
  selection!: SelectionManager;
  transform!: TransformController;
  toolManager!: ToolManager;

  private canvasShadow!: Graphics;
  private canvasBg!: Graphics;
  private elementsLayer!: Container;
  private overlayLayer!: Container;
  private canvasDecorationZoom = 1;
  private elements: BaseElement[] = [];
  private hostElement: HTMLElement | null = null;
  private _initialized = false;
  private _initPromise: Promise<void> | null = null;

  static getInstance(): EditorEngine {
    if (!EditorEngine.instance) {
      EditorEngine.instance = new EditorEngine();
    }
    return EditorEngine.instance;
  }

  static destroyInstance() {
    EditorEngine.instance?.destroy();
  }

  get initialized() {
    return this._initialized;
  }

  async init(hostElement: HTMLElement) {
    if (this._initialized) return;
    if (this._initPromise) return this._initPromise;

    this._initPromise = this._doInit(hostElement);
    return this._initPromise;
  }

  private async _doInit(hostElement: HTMLElement) {
    this.hostElement = hostElement;
    this.app = new Application();

    const width = hostElement.clientWidth || 800;
    const height = hostElement.clientHeight || 600;

    await this.app.init({
      width,
      height,
      backgroundColor: 0xe6e6e6,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

  const canvas = this.app.canvas as HTMLCanvasElement;
  canvas.tabIndex = 0;
  canvas.dataset.imageEditorCanvas = 'true';
  canvas.style.outline = 'none';
  hostElement.appendChild(canvas);

    this.viewport = new Viewport(this.app);
    this.app.stage.addChild(this.viewport.container);

    this.canvasShadow = new Graphics();
    this.canvasShadow.eventMode = 'none';
    this.canvasShadow.filters = [new BlurFilter({ strength: 6 })];
    this.viewport.container.addChild(this.canvasShadow);

    this.canvasBg = new Graphics();
    this.viewport.container.addChild(this.canvasBg);

    this.elementsLayer = new Container();
    this.viewport.container.addChild(this.elementsLayer);

    this.overlayLayer = new Container();
    this.overlayLayer.eventMode = 'none';
    this.app.stage.addChild(this.overlayLayer);

    this.selection = new SelectionManager(this.overlayLayer);
    this.transform = new TransformController(this.selection, this.viewport);

    this.drawCanvasBackground();
    this.setupRenderLoop();

    this.toolManager = new ToolManager(this);

    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    this.viewport.fitContent(canvasWidth, canvasHeight);

    this._initialized = true;
  }

  private drawCanvasBackground(targetZoom = this.viewport?.zoom ?? 1) {
    const { canvasWidth, canvasHeight, backgroundColor } = useEditorStore.getState();
    const zoom = Math.max(targetZoom, 0.0001);

    this.canvasShadow.clear();
    this.canvasBg.clear();

    const shadowSpread = 3 / zoom;
    const shadowOffsetY = 7 / zoom;
    const shadowRadius = 3 / zoom;
    this.canvasShadow.roundRect(
      -shadowSpread,
      shadowOffsetY - shadowSpread,
      canvasWidth + shadowSpread * 2,
      canvasHeight + shadowSpread * 2,
      shadowRadius
    );
    this.canvasShadow.fill({ color: 0x000000, alpha: 0.1 });

    this.canvasBg.roundRect(0, 0, canvasWidth, canvasHeight, 0);
    this.canvasBg.fill(backgroundColor);

    const borderWidth = 1 / zoom;
    const borderInset = borderWidth / 2;
    this.canvasBg.rect(
      -borderInset,
      -borderInset,
      canvasWidth + borderWidth,
      canvasHeight + borderWidth
    );
    this.canvasBg.stroke({ width: borderWidth, color: 0xbbbbbb });

    this.canvasDecorationZoom = zoom;
  }

  redrawCanvasDecorations(targetZoom = this.viewport?.zoom ?? 1) {
    this.drawCanvasBackground(targetZoom);
  }

  private setupRenderLoop() {
    this.app.ticker.add(() => {
      const zoom = this.viewport.zoom;
      if (Math.abs(zoom - this.canvasDecorationZoom) > 0.0001) {
        this.drawCanvasBackground(zoom);
      }
      this.selection.drawOverlay(zoom);
    });
  }

  addElement(element: BaseElement) {
    this.elements.push(element);
    this.elementsLayer.addChild(element.container);
    this.selection.setElements(this.elements);
    this.syncElementsToStore();
  }

  removeElement(id: string) {
    const idx = this.elements.findIndex((el) => el.id === id);
    if (idx === -1) return;

    const element = this.elements[idx];
    this.elements.splice(idx, 1);
    this.elementsLayer.removeChild(element.container);
    element.destroy();

    this.selection.removeFromSelection([id]);
    this.selection.setElements(this.elements);
    this.syncElementsToStore();
  }

  softRemoveElement(id: string): BaseElement | undefined {
    const idx = this.elements.findIndex((el) => el.id === id);
    if (idx === -1) return undefined;

    const element = this.elements[idx];
    this.elements.splice(idx, 1);
    this.elementsLayer.removeChild(element.container);

    this.selection.removeFromSelection([id]);
    this.selection.setElements(this.elements);
    this.syncElementsToStore();
    return element;
  }

  reattachElement(element: BaseElement, index: number): void {
    const clampedIndex = Math.max(0, Math.min(index, this.elements.length));
    this.elements.splice(clampedIndex, 0, element);

    this.elementsLayer.removeChildren();
    for (const el of this.elements) {
      this.elementsLayer.addChild(el.container);
    }

    this.selection.setElements(this.elements);
    this.syncElementsToStore();
  }

  duplicateSelected(): BaseElement[] {
    const selected = this.selection.getSelected();
    const offset = 20;
    const added: BaseElement[] = [];
    for (const el of selected) {
      const copy = el.clone();
      if (!copy) continue;
      copy.x = el.x + offset;
      copy.y = el.y + offset;
      this.addElement(copy);
      added.push(copy);
    }
    if (added.length === 0) return [];
    this.selection.select(added[0], false);
    for (let i = 1; i < added.length; i++) {
      this.selection.select(added[i], true);
    }
    return added;
  }

  getElement(id: string): BaseElement | undefined {
    return this.elements.find((el) => el.id === id);
  }

  getElements(): BaseElement[] {
    return [...this.elements];
  }

  reorderElement(id: string, newIndex: number) {
    const oldIdx = this.elements.findIndex((el) => el.id === id);
    if (oldIdx === -1) return;

    const [el] = this.elements.splice(oldIdx, 1);
    this.elements.splice(newIndex, 0, el);

    this.elementsLayer.removeChildren();
    for (const element of this.elements) {
      this.elementsLayer.addChild(element.container);
    }

    this.selection.setElements(this.elements);
    this.syncElementsToStore();
  }

  syncElementsToStore() {
    useElementStore.getState().setElements(this.elements.map((el) => el.toSnapshot()));
  }

  updateCanvasBackground(color?: string) {
    if (color) {
      useEditorStore.getState().setBackgroundColor(color);
    }
    this.drawCanvasBackground();
  }

  setCanvasSize(width: number, height: number) {
    if (!this._initialized) return;
    useEditorStore.getState().setCanvasSize(width, height);
    this.drawCanvasBackground();
    this.fitToScreen();
  }

  resize(width: number, height: number) {
    if (!this._initialized) return;
    this.app.renderer.resize(width, height);
    this.fitToScreen();
  }

  fitToScreen() {
    if (!this._initialized || !this.viewport) return;
    const { canvasWidth, canvasHeight } = useEditorStore.getState();
    this.viewport.fitContent(canvasWidth, canvasHeight);
  }

  destroy() {
    if (!this._initialized) return;

    this.toolManager?.destroy();
    this.viewport?.destroy();
    this.selection?.destroy();
    for (const el of this.elements) {
      el.destroy();
    }
    this.elements = [];
    if (this.hostElement && this.app?.canvas && this.hostElement.contains(this.app.canvas)) {
      this.hostElement.removeChild(this.app.canvas as HTMLCanvasElement);
    }
    this.app?.destroy(true);
    this._initialized = false;
    this._initPromise = null;
    EditorEngine.instance = null;
  }
}
