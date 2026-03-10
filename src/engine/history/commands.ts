import type { Command } from './Command';
import { EditorEngine } from '../core/EditorEngine';
import type { BaseElement } from '../elements/BaseElement';
import { TextElement, type TextConfig } from '../elements/TextElement';

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
    EditorEngine.getInstance().removeElement(this.element.id);
  }
  redo() {
    this.execute();
  }
}

export class RemoveElementCommand implements Command {
  readonly label: string;
  private element: BaseElement;
  private index: number;

  constructor(element: BaseElement, index: number) {
    this.element = element;
    this.index = index;
    this.label = `Remove ${element.type}`;
  }

  execute() {
    EditorEngine.getInstance().removeElement(this.element.id);
  }
  undo() {
    const engine = EditorEngine.getInstance();
    engine.addElement(this.element);
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
