# Phase 5: History, Filters, and Advanced Features

## Goal

Add command-based undo/redo history, filter pipeline integration, robust layer operations, and export flow.

## Command-Based History

### Why commands instead of snapshots

The old Fabric.js approach used `canvas.toJSON()` / `loadFromJSON()` snapshots — each undo state was a full serialization of the entire canvas. This was slow for large canvases and wasted memory.

The command pattern stores only the delta: what changed and how to reverse it. A move command stores just `{ elementId, fromX, fromY, toX, toY }` instead of a multi-KB JSON blob.

### Files

#### `engine/history/Command.ts`

Interface:

```ts
interface Command {
  readonly label: string;  // human-readable description
  execute(): void;
  undo(): void;
  redo(): void;
}
```

#### `engine/history/commands.ts`

Concrete command implementations:

| Command | Captures | Undo behavior |
|---------|----------|---------------|
| `MoveCommand` | element ID, from/to x/y | Restores original position |
| `ResizeCommand` | element ID, from/to width/height | Restores original size |
| `RotateCommand` | element ID, from/to angle | Restores original rotation |
| `TransformCommand` | element ID, full before/after snapshot (x, y, w, h, rotation) | Restores all transform properties at once |
| `AddElementCommand` | element reference | Removes element on undo |
| `RemoveElementCommand` | element reference | Re-adds element on undo |
| `ReorderCommand` | element ID, from/to index | Swaps back to original index |
| `UpdateTextConfigCommand` | text config before/after | Restores typography state |

All commands call `EditorEngine.getInstance()` internally to apply changes, followed by `syncElementsToStore()` to update the UI.

#### `engine/history/HistoryManager.ts`

Thin wrapper around `historyStore`:

```ts
class HistoryManager {
  executeCommand(command: Command) → push to store (calls execute)
  undo() → delegates to store
  redo() → delegates to store
  clear() → delegates to store
}
```

### Store (`stores/historyStore.ts`)

- `undoStack: Command[]` — max 50 entries (older entries are discarded)
- `redoStack: Command[]` — cleared on every new push
- `canUndo` / `canRedo` — derived booleans
- `push(command)` — calls `command.execute()`, pushes to undo stack, clears redo
- `undo()` — pops from undo, calls `command.undo()`, pushes to redo
- `redo()` — pops from redo, calls `command.redo()`, pushes to undo

## Filters

### Filter Pipeline

Filters are applied per-element via Pixi `container.filters`. They are non-destructive and can be changed or cleared at any time.

### `engine/filters/FilterManager.ts`

`FilterManager` provides filter factories/presets for engine-level reuse.

Typical presets include grayscale, sepia, brightness, contrast, saturate, desaturate, invert, blur, hue shift, and noise.

**API:**
- `applyPreset(filterId)` — applies the preset filter to all selected elements
- `clearFilters()` — removes all filters from selected elements

Filters are applied by reading `selectedIds` from `elementStore`, looking up each element via `engine.getElement(id)`, and setting `el.container.filters`.

### UI Integration

`FiltersPanel` presents preset actions and a clear option. Applying a preset updates both `container.filters` and element metadata (`appliedFilterId`) so state can be serialized.

The panel shows "Select an element to apply filters" when nothing is selected.

## Layer Management

### Engine side (`EditorEngine`)

- Elements are stored in an ordered array — index 0 is bottom, last is top
- `reorderElement(id, newIndex)` — splices the element to a new position, reorders `elementsLayer` children, syncs to store
- `addElement()` always appends to the end (top of stack)

### UI side (`LayersPanel`)

- Displays elements in reverse order (top-most first)
- Each row supports move up/down, visibility, lock, delete
- Clicking a row selects the element
- Visibility toggle sets `element.visible` directly on the engine element
- Lock toggle sets `element.locked` — locked elements can't be selected or moved
- Delete removes the element from the engine

Reorder operations are undoable via `ReorderCommand`.

## Export (`utils/export.ts`)

**Flow:**
1. Save the current viewport transform (scale, position)
2. Reset viewport to 1:1 scale at origin
3. Resize the renderer to canvas dimensions (from `editorStore`)
4. Extract the viewport container to an `HTMLCanvasElement` via `renderer.extract.canvas()`
5. Restore original viewport transform and renderer size
6. Convert canvas to data URL (`image/png` or `image/jpeg`)
7. Trigger download via an `<a>` element click

**API:** `exportCanvas(format: 'png' | 'jpeg' = 'png', quality = 1)`

This ensures exported output matches artboard dimensions rather than current viewport zoom/pan.
