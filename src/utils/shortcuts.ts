import { useHistoryStore } from '../stores/historyStore';
import { useToolStore } from '../stores/toolStore';
import { useElementStore } from '../stores/elementStore';
import { EditorEngine } from '../engine/core/EditorEngine';
import { useEditorStore } from '../stores/editorStore';
import { useTextEditStore } from '../stores/textEditStore';
import { RemoveElementCommand, BatchCommand, MoveCommand } from '../engine/history/commands';
import type { ToolType } from '../types';
import { isToolEnabled } from '../embed/config';
import {
  getActiveEditorElement,
  queryEditorElement,
  shouldHandleEditorKeyboardEvent,
} from '../embed/domEnvironment';

const SHORTCUT_MAP: Record<string, () => void> = {
  'ctrl+z': () => useHistoryStore.getState().undo(),
  'meta+z': () => useHistoryStore.getState().undo(),
  'ctrl+shift+z': () => useHistoryStore.getState().redo(),
  'meta+shift+z': () => useHistoryStore.getState().redo(),
  'ctrl+y': () => useHistoryStore.getState().redo(),
  'meta+y': () => useHistoryStore.getState().redo(),
  'ctrl+s': () => useEditorStore.getState().setSaveDialogOpen(true),
  'meta+s': () => useEditorStore.getState().setSaveDialogOpen(true),
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
  'c': () => {
    if (isToolEnabled('crop')) {
      useToolStore.getState().setActiveTool('crop');
    }
  },
  'b': () => {
    if (isToolEnabled('draw')) {
      useToolStore.getState().setActiveTool('draw');
    }
  },
  't': () => {
    if (isToolEnabled('text')) {
      useToolStore.getState().setActiveTool('text');
    }
  },
};

function deleteSelected() {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;
  const selectedIds = useElementStore.getState().selectedIds;
  const validElements = selectedIds
    .map((id) => engine.getElement(id))
    .filter((el): el is NonNullable<typeof el> => el !== undefined);
  if (validElements.length === 0) return;

  if (validElements.length === 1) {
    useHistoryStore.getState().push(new RemoveElementCommand(validElements[0]));
  } else {
    const commands = validElements.map((el) => new RemoveElementCommand(el));
    useHistoryStore.getState().push(new BatchCommand(commands, 'Delete elements'));
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

function isEditableTarget(target: HTMLElement | null): boolean {
  return Boolean(
    target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  );
}

function handleTextEditShortcut(key: string, event: KeyboardEvent): boolean {
  if (!useTextEditStore.getState().activeElementId) {
    return false;
  }

  if (key !== 'ctrl+a' && key !== 'meta+a') {
    return false;
  }

  event.preventDefault();

  const activeElement = getActiveEditorElement();
  const overlay =
    activeElement instanceof HTMLTextAreaElement
      ? activeElement
      : getActiveEditorElement() instanceof HTMLTextAreaElement
        ? getActiveEditorElement()
        : queryEditorElement<HTMLTextAreaElement>('textarea[data-text-edit-overlay="true"]');

  if (overlay instanceof HTMLTextAreaElement) {
    overlay.focus();
    overlay.select();
  }

  return true;
}

export function setupKeyboardShortcuts(): () => void {
  const handler = (e: KeyboardEvent) => {
    if (!shouldHandleEditorKeyboardEvent(e)) {
      return;
    }

    const key = buildKey(e);
    if (handleTextEditShortcut(key, e)) {
      return;
    }

    const target = e.target as HTMLElement | null;
    if (isEditableTarget(target)) {
      return;
    }

    if (handleArrowNudge(e)) {
      return;
    }

    commitNudgeBatch();

    const action = SHORTCUT_MAP[key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  const pointerHandler = () => {
    commitNudgeBatch();
  };

  window.addEventListener('keydown', handler);
  window.addEventListener('pointerdown', pointerHandler);
  return () => {
    window.removeEventListener('keydown', handler);
    window.removeEventListener('pointerdown', pointerHandler);
    commitNudgeBatch();
  };
}

// Nudge batching state
let nudgeTimer: ReturnType<typeof setTimeout> | null = null;
let nudgeStartState: Map<string, { x: number; y: number }> | null = null;

function commitNudgeBatch() {
  if (nudgeTimer !== null) {
    clearTimeout(nudgeTimer);
    nudgeTimer = null;
  }

  const startState = nudgeStartState;
  nudgeStartState = null;
  if (!startState) return;

  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return;

  const commands: MoveCommand[] = [];
  for (const [id, start] of startState.entries()) {
    const el = engine.getElement(id);
    if (el && (start.x !== el.x || start.y !== el.y)) {
      commands.push(new MoveCommand(id, start.x, start.y, el.x, el.y));
    }
  }

  if (commands.length === 0) return;
  if (commands.length === 1) {
    useHistoryStore.getState().record(commands[0]);
  } else {
    useHistoryStore.getState().record(new BatchCommand(commands, 'Nudge elements'));
  }
}

function handleArrowNudge(e: KeyboardEvent): boolean {
  const engine = EditorEngine.getInstance();
  if (!engine.initialized) return false;

  const step = e.shiftKey ? 10 : 1;
  const selected = engine.selection.getSelected();
  if (selected.length === 0) return false;

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
      return false;
  }

  e.preventDefault();

  // Capture start positions on the first key press of a batch
  if (!nudgeStartState) {
    nudgeStartState = new Map(selected.map((el) => [el.id, { x: el.x, y: el.y }]));
  }

  for (const el of selected) {
    el.x += dx;
    el.y += dy;
  }

  engine.syncElementsToStore();
  engine.selection.drawOverlay(engine.viewport.zoom);

  // Debounce history commit: wait 800 ms after last key press
  if (nudgeTimer !== null) clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => {
    commitNudgeBatch();
  }, 800);

  return true;
}
