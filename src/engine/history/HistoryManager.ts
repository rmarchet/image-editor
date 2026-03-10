import type { Command } from './Command';
import { useHistoryStore } from '../../stores/historyStore';

export class HistoryManager {
  executeCommand(command: Command) {
    useHistoryStore.getState().push(command);
  }

  undo() {
    useHistoryStore.getState().undo();
  }

  redo() {
    useHistoryStore.getState().redo();
  }

  clear() {
    useHistoryStore.getState().clear();
  }
}
