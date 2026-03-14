import type { Command } from './Command';
import { EditorEngine } from '../core/EditorEngine';
import type { BaseElement } from '../elements/BaseElement';
import { TextElement, type TextConfig } from '../elements/TextElement';
import { ShapeElement, type ShapeConfig } from '../elements/ShapeElement';
import { DrawingElement } from '../elements/DrawingElement';
import { FILTER_PRESETS } from '../filters/FilterManager';
import type { DrawingStrokeData } from '../../types';

function cloneStrokes(strokes: DrawingStrokeData[]): DrawingStrokeData[] {
  return strokes.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({ ...point })),
  }));
}

export class MoveCommand implements Command {
  readonly label: string;
  private elementId: string;
  private fromX: number;
  private fromY: number;
  private toX: number;
  private toY: number;

  constructor(elementId: string, fromX: number, fromY: number, toX: number, toY: number) {
    this.elementId = elementId;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.label = 'Move element';
  }

  execute() {
    this.applyPosition(this.toX, this.toY);
  }

  undo() {
    this.applyPosition(this.fromX, this.fromY);
  }

  redo() {
    this.execute();
  }

  private applyPosition(x: number, y: number) {
    const el = EditorEngine.getInstance().getElement(this.elementId);
    if (el) {
      el.x = x;
      el.y = y;
      EditorEngine.getInstance().syncElementsToStore();
    }
  }
}

export class ResizeCommand implements Command {
  readonly label = 'Resize element';
  private elementId: string;
  private fromW: number;
  private fromH: number;
  private toW: number;
  private toH: number;

  constructor(elementId: string, fromW: number, fromH: number, toW: number, toH: number) {
    this.elementId = elementId;
    this.fromW = fromW;
    this.fromH = fromH;
    this.toW = toW;
    this.toH = toH;
  }

  execute() {
    this.applySize(this.toW, this.toH);
  }
  undo() {
    this.applySize(this.fromW, this.fromH);
  }
  redo() {
    this.execute();
  }

  private applySize(w: number, h: number) {
    const el = EditorEngine.getInstance().getElement(this.elementId);
    if (el) {
      el.width = w;
      el.height = h;
      EditorEngine.getInstance().syncElementsToStore();
    }
  }
}

export class RotateCommand implements Command {
  readonly label = 'Rotate element';
  private elementId: string;
  private fromAngle: number;
  private toAngle: number;

  constructor(elementId: string, fromAngle: number, toAngle: number) {
    this.elementId = elementId;
    this.fromAngle = fromAngle;
    this.toAngle = toAngle;
  }

  execute() {
    const el = EditorEngine.getInstance().getElement(this.elementId);
    if (el) {
      el.rotation = this.toAngle;
      EditorEngine.getInstance().syncElementsToStore();
    }
  }
  undo() {
    const el = EditorEngine.getInstance().getElement(this.elementId);
    if (el) {
      el.rotation = this.fromAngle;
      EditorEngine.getInstance().syncElementsToStore();
    }
  }
  redo() {
    this.execute();
  }
}

export class AddElementCommand implements Command {
  readonly label: string;
  private element: BaseElement;

  constructor(element: BaseElement) {
    this.element = element;
    this.label = `Add ${element.type}`;
  }

  execute() {
    EditorEngine.getInstance().addElement(this.element);
  }
  undo() {
    EditorEngine.getInstance().softRemoveElement(this.element.id);
  }
  redo() {
    this.execute();
  }
}

export class RemoveElementCommand implements Command {
  readonly label: string;
  private element: BaseElement;
  private savedIndex = -1;

  constructor(element: BaseElement) {
    this.element = element;
    this.label = `Remove ${element.type}`;
  }

  execute() {
    const engine = EditorEngine.getInstance();
    const idx = engine.getElements().findIndex((el) => el.id === this.element.id);
    if (idx === -1) return;
    this.savedIndex = idx;
    engine.softRemoveElement(this.element.id);
  }
  undo() {
    if (this.savedIndex === -1) return;
    EditorEngine.getInstance().reattachElement(this.element, this.savedIndex);
  }
  redo() {
    this.execute();
  }
}

export class ReorderCommand implements Command {
  readonly label = 'Reorder element';
  private elementId: string;
  private fromIndex: number;
  private toIndex: number;

  constructor(elementId: string, fromIndex: number, toIndex: number) {
    this.elementId = elementId;
    this.fromIndex = fromIndex;
    this.toIndex = toIndex;
  }

  execute() {
    EditorEngine.getInstance().reorderElement(this.elementId, this.toIndex);
  }
  undo() {
    EditorEngine.getInstance().reorderElement(this.elementId, this.fromIndex);
  }
  redo() {
    this.execute();
  }
}

export class TransformCommand implements Command {
  readonly label = 'Transform element';
  private elementId: string;
  private before: { x: number; y: number; width: number; height: number; rotation: number };
  private after: { x: number; y: number; width: number; height: number; rotation: number };

  constructor(
    elementId: string,
    before: { x: number; y: number; width: number; height: number; rotation: number },
    after: { x: number; y: number; width: number; height: number; rotation: number }
  ) {
    this.elementId = elementId;
    this.before = { ...before };
    this.after = { ...after };
  }

  execute() {
    this.apply(this.after);
  }
  undo() {
    this.apply(this.before);
  }
  redo() {
    this.execute();
  }

  private apply(state: typeof this.before) {
    const el = EditorEngine.getInstance().getElement(this.elementId);
    if (el) {
      el.x = state.x;
      el.y = state.y;
      el.width = state.width;
      el.height = state.height;
      el.rotation = state.rotation;
      EditorEngine.getInstance().syncElementsToStore();
    }
  }
}

export class UpdateTextConfigCommand implements Command {
  readonly label = 'Update text';
  private elementId: string;
  private before: TextConfig;
  private after: TextConfig;

  constructor(elementId: string, before: TextConfig, after: TextConfig) {
    this.elementId = elementId;
    this.before = { ...before };
    this.after = { ...after };
  }

  execute() {
    this.apply(this.after);
  }

  undo() {
    this.apply(this.before);
  }

  redo() {
    this.execute();
  }

  private apply(config: TextConfig) {
    const engine = EditorEngine.getInstance();
    const element = engine.getElement(this.elementId);
    if (!(element instanceof TextElement)) {
      return;
    }

    element.updateConfig(config);
    engine.syncElementsToStore();
  }
}

export class UpdateDrawingStrokesCommand implements Command {
  readonly label = 'Update drawing';
  private elementId: string;
  private before: DrawingStrokeData[];
  private after: DrawingStrokeData[];

  constructor(elementId: string, before: DrawingStrokeData[], after: DrawingStrokeData[]) {
    this.elementId = elementId;
    this.before = cloneStrokes(before);
    this.after = cloneStrokes(after);
  }

  execute() {
    this.apply(this.after);
  }

  undo() {
    this.apply(this.before);
  }

  redo() {
    this.execute();
  }

  private apply(strokes: DrawingStrokeData[]) {
    const engine = EditorEngine.getInstance();
    const element = engine.getElement(this.elementId);
    if (!(element instanceof DrawingElement)) {
      return;
    }

    element.updateStrokes(strokes);
    engine.syncElementsToStore();
  }
}

export class FlipCommand implements Command {
  readonly label: string;
  private elementId: string;
  private axis: 'h' | 'v';

  constructor(elementId: string, axis: 'h' | 'v') {
    this.elementId = elementId;
    this.axis = axis;
    this.label = axis === 'h' ? 'Flip horizontal' : 'Flip vertical';
  }

  private applyFlip() {
    const engine = EditorEngine.getInstance();
    const el = engine.getElement(this.elementId);
    if (!el) return;
    if (this.axis === 'h') {
      el.container.scale.x *= -1;
    } else {
      el.container.scale.y *= -1;
    }
    engine.syncElementsToStore();
    engine.selection.drawOverlay(engine.viewport.zoom);
  }

  execute() { this.applyFlip(); }
  undo() { this.applyFlip(); }
  redo() { this.applyFlip(); }
}

export class UpdateShapeConfigCommand implements Command {
  readonly label = 'Update shape';
  private elementId: string;
  private before: ShapeConfig;
  private after: ShapeConfig;

  constructor(elementId: string, before: ShapeConfig, after: ShapeConfig) {
    this.elementId = elementId;
    this.before = { ...before };
    this.after = { ...after };
  }

  execute() { this.apply(this.after); }
  undo() { this.apply(this.before); }
  redo() { this.execute(); }

  private apply(config: ShapeConfig) {
    const engine = EditorEngine.getInstance();
    const element = engine.getElement(this.elementId);
    if (!(element instanceof ShapeElement)) return;
    element.updateConfig(config);
    engine.syncElementsToStore();
  }
}

export class UpdateFilterCommand implements Command {
  readonly label = 'Apply filter';
  private elementId: string;
  private beforeFilterId: string | null;
  private afterFilterId: string | null;

  constructor(elementId: string, beforeFilterId: string | null, afterFilterId: string | null) {
    this.elementId = elementId;
    this.beforeFilterId = beforeFilterId;
    this.afterFilterId = afterFilterId;
  }

  execute() { this.apply(this.afterFilterId); }
  undo() { this.apply(this.beforeFilterId); }
  redo() { this.execute(); }

  private apply(filterId: string | null) {
    const engine = EditorEngine.getInstance();
    const el = engine.getElement(this.elementId);
    if (!el) return;
    if (!filterId) {
      el.container.filters = [];
      el.appliedFilterId = null;
    } else {
      const preset = FILTER_PRESETS.find((p) => p.id === filterId);
      if (preset) {
        el.container.filters = [preset.create()];
        el.appliedFilterId = filterId;
      } else {
        el.container.filters = [];
        el.appliedFilterId = null;
      }
    }
    engine.syncElementsToStore();
  }
}

export class UpdateCanvasBackgroundCommand implements Command {
  readonly label = 'Change background';
  private before: string | undefined;
  private after: string | undefined;

  constructor(before: string | undefined, after: string | undefined) {
    this.before = before;
    this.after = after;
  }

  execute() { EditorEngine.getInstance().updateCanvasBackground(this.after); }
  undo() { EditorEngine.getInstance().updateCanvasBackground(this.before); }
  redo() { this.execute(); }
}

export class UpdateCanvasSizeCommand implements Command {
  readonly label = 'Resize canvas';
  private before: { width: number; height: number };
  private after: { width: number; height: number };

  constructor(
    before: { width: number; height: number },
    after: { width: number; height: number },
  ) {
    this.before = { ...before };
    this.after = { ...after };
  }

  execute() { EditorEngine.getInstance().setCanvasSize(this.after.width, this.after.height); }
  undo() { EditorEngine.getInstance().setCanvasSize(this.before.width, this.before.height); }
  redo() { this.execute(); }
}

export class DuplicateCommand implements Command {
  readonly label = 'Duplicate';
  private copies: BaseElement[];

  constructor(copies: BaseElement[]) {
    this.copies = copies;
  }

  execute() {
    const engine = EditorEngine.getInstance();
    for (const copy of this.copies) {
      engine.addElement(copy);
    }
    if (this.copies.length > 0) {
      engine.selection.select(this.copies[0], false);
      for (let i = 1; i < this.copies.length; i++) {
        engine.selection.select(this.copies[i], true);
      }
    }
  }

  undo() {
    const engine = EditorEngine.getInstance();
    for (const copy of this.copies) {
      engine.softRemoveElement(copy.id);
    }
  }

  redo() { this.execute(); }
}

export class BatchCommand implements Command {
  readonly label: string;
  private commands: Command[];

  constructor(commands: Command[], label = 'Batch') {
    this.commands = commands;
    this.label = label;
  }

  execute() {
    for (const cmd of this.commands) {
      cmd.execute();
    }
  }

  undo() {
    for (const cmd of [...this.commands].reverse()) {
      cmd.undo();
    }
  }

  redo() { this.execute(); }
}
