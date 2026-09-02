import { create } from 'zustand';
import type { Command } from '../engine/history/Command';

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  canUndo: boolean;
  canRedo: boolean;

  push: (command: Command) => void;
  record: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

const MAX_HISTORY = 50;

function getHistoryStoreDefaults() {
  return {
    undoStack: [] as Command[],
    redoStack: [] as Command[],
    canUndo: false,
    canRedo: false,
  };
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  ...getHistoryStoreDefaults(),

  push: (command) => {
    command.execute();
    set((state) => {
      const undoStack = [...state.undoStack, command].slice(-MAX_HISTORY);
      return { undoStack, redoStack: [], canUndo: true, canRedo: false };
    });
  },

  record: (command) => {
    set((state) => {
      const undoStack = [...state.undoStack, command].slice(-MAX_HISTORY);
      return { undoStack, redoStack: [], canUndo: true, canRedo: false };
    });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;

    const command = undoStack[undoStack.length - 1];
    command.undo();

    set((state) => {
      const newUndo = state.undoStack.slice(0, -1);
      const newRedo = [...state.redoStack, command];
      return {
        undoStack: newUndo,
        redoStack: newRedo,
        canUndo: newUndo.length > 0,
        canRedo: true,
      };
    });
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const command = redoStack[redoStack.length - 1];
    command.redo();

    set((state) => {
      const newRedo = state.redoStack.slice(0, -1);
      const newUndo = [...state.undoStack, command];
      return {
        undoStack: newUndo,
        redoStack: newRedo,
        canUndo: true,
        canRedo: newRedo.length > 0,
      };
    });
  },

  clear: () =>
    set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false }),
}));

export function resetHistoryStore() {
  useHistoryStore.setState(getHistoryStoreDefaults());
}
