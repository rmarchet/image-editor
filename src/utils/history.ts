import { fabric } from 'fabric';

export interface HistoryState {
  canvasState: string;
  timestamp: number;
}

export class HistoryManager {
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private canvas: fabric.Canvas | null = null;
  private maxStates: number = 30;

  setCanvas(canvas: fabric.Canvas) {
    this.canvas = canvas;
  }

  saveState() {
    if (!this.canvas) return;

    const state: HistoryState = {
      canvasState: JSON.stringify(this.canvas.toJSON()),
      timestamp: Date.now()
    };

    this.undoStack.push(state);
    this.redoStack = []; // Clear redo stack when new action is performed

    // Limit the size of undo stack
    if (this.undoStack.length > this.maxStates) {
      this.undoStack.shift();
    }
  }

  undo() {
    if (!this.canvas || this.undoStack.length === 0) return false;

    const currentState: HistoryState = {
      canvasState: JSON.stringify(this.canvas.toJSON()),
      timestamp: Date.now()
    };
    this.redoStack.push(currentState);

    const previousState = this.undoStack.pop();
    if (previousState) {
      this.loadCanvasState(previousState.canvasState);
      return true;
    }
    return false;
  }

  redo() {
    if (!this.canvas || this.redoStack.length === 0) return false;

    const currentState: HistoryState = {
      canvasState: JSON.stringify(this.canvas.toJSON()),
      timestamp: Date.now()
    };
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop();
    if (nextState) {
      this.loadCanvasState(nextState.canvasState);
      return true;
    }
    return false;
  }

  private loadCanvasState(stateJson: string) {
    if (!this.canvas) return;
    
    this.canvas.clear();
    this.canvas.loadFromJSON(stateJson, () => {
      this.canvas?.renderAll();
      
      // Ensure the first object (main image) has correct settings
      const mainImage = this.canvas?.getObjects()[0] as fabric.Image;
      if (mainImage) {
        mainImage.set({
          selectable: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false
        });
      }
    });
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
} 