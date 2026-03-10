import { useHistoryStore } from '../stores/historyStore';
import { useToolStore } from '../stores/toolStore';
import { useElementStore } from '../stores/elementStore';
import { EditorEngine } from '../engine/core/EditorEngine';
import { exportCanvas } from './export';
import type { ToolType } from '../types';

const SHORTCUT_MAP: Record<string, () => void> = {
  'ctrl+z': () => useHistoryStore.getState().undo(),
  'meta+z': () => useHistoryStore.getState().undo(),
  'ctrl+shift+z': () => useHistoryStore.getState().redo(),
  'meta+shift+z': () => useHistoryStore.getState().redo(),
  'ctrl+y': () => useHistoryStore.getState().redo(),
  'meta+y': () => useHistoryStore.getState().redo(),
  'ctrl+s': () => exportCanvas(),
  'meta+s': () => exportCanvas(),
  'ctrl+a': () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    const elements = engine.getElements();
    for (const el of elements) {
      engine.selection.select(el, true);
    }
  },
  'meta+a': () => {
    const engine = EditorEngine.getInstance();
    if (!engine.initialized) return;
    const elements = engine.getElements();
    for (const el of elements) {
      engine.selection.select(el, true);
    }
  },
  'delete': () => deleteSelected(),
  'backspace': () => deleteSelected(),
  'escape': () => {
    useToolStore.getState().setActiveTool('select');
    const engine = EditorEngine.getInstance();
    if (engine.initialized) engine.selection.deselectAll();
  },
  'v': () => useToolStore.getState().setActiveTool('select'),
  'c': () => useToolStore.getState().setActiveTool('crop'),
  'b': () => useToolStore.getState().setActiveTool('draw'),
  't': () => useToolStore.getState().setActiveTool('text'),
};

function deleteSelected() {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;
  const selectedIds = useElementStore.getState().selectedIds;
  for (const id of selectedIds) {
    engine.removeElement(id);
  }
}

function buildKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.metaKey) parts.push('meta');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

export function setupKeyboardShortcuts(): () => void {
  const handler = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const key = buildKey(e);
    const action = SHORTCUT_MAP[key];
    if (action) {
      e.preventDefault();
      action();
    }

    handleArrowNudge(e);
  };

  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}

function handleArrowNudge(e: KeyboardEvent) {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;

  const step = e.shiftKey ? 10 : 1;
  const selected = engine.selection.getSelected();
  if (selected.length === 0) return;

  let dx = 0;
  let dy = 0;

  switch (e.key) {
    case 'ArrowUp':
      dy = -step;
      break;
    case 'ArrowDown':
      dy = step;
      break;
    case 'ArrowLeft':
      dx = -step;
      break;
    case 'ArrowRight':
      dx = step;
      break;
    default:
      return;
  }

  e.preventDefault();

  for (const el of selected) {
    el.x += dx;
    el.y += dy;
  }

  engine.syncElementsToStore();
  engine.selection.drawOverlay(engine.viewport.zoom);
}
