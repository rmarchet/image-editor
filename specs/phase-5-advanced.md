# Phase 5: History, Filters, and Advanced Features

## Goal

Add command-based undo/redo history, a WebGL filter pipeline, layer management, and canvas export. This phase elevates the editor from a basic drawing tool to a professional editing experience.

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
| `RemoveElementCommand` | element reference + index | Re-adds element on undo |
| `ReorderCommand` | element ID, from/to index | Swaps back to original index |

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

## WebGL Filters

### Filter Pipeline

Filters are applied per-element via PixiJS's built-in `container.filters` array. They are non-destructive — the original image/shape data is preserved, and filters can be added, removed, or replaced at any time.

### `engine/filters/FilterManager.ts`

Provides a registry of 10 filter presets:

| Preset ID | Display Name | PixiJS Implementation |
|-----------|-------------|----------------------|
| `grayscale` | Grayscale | `ColorMatrixFilter.grayscale(0.5)` |
| `sepia` | Sepia | `ColorMatrixFilter.sepia()` |
| `brightness` | Brighten | `ColorMatrixFilter.brightness(1.4)` |
| `contrast` | Contrast | `ColorMatrixFilter.contrast(0.4)` |
| `saturate` | Saturate | `ColorMatrixFilter.saturate(1.5)` |
| `desaturate` | Desaturate | `ColorMatrixFilter.desaturate()` |
| `invert` | Invert | `ColorMatrixFilter.negative()` |
| `blur` | Blur | `BlurFilter({ strength: 4 })` |
| `noise` | Noise | `NoiseFilter({ noise: 0.3 })` |
| `hueRotate` | Hue Shift | `ColorMatrixFilter.hue(90)` |

**API:**
- `applyPreset(filterId)` — applies the preset filter to all selected elements
- `clearFilters()` — removes all filters from selected elements

Filters are applied by reading `selectedIds` from `elementStore`, looking up each element via `engine.getElement(id)`, and setting `el.container.filters`.

### UI Integration

The `FiltersPanel` in the sidebar presents filters as a 2-column grid. Clicking a preset calls `applyFilter()` which creates the appropriate PixiJS filter and applies it. The "None" option clears all filters.

The panel shows "Select an element to apply filters" when nothing is selected.

## Layer Management

### Engine side (`EditorEngine`)

- Elements are stored in an ordered array — index 0 is bottom, last is top
- `reorderElement(id, newIndex)` — splices the element to a new position, reorders `elementsLayer` children, syncs to store
- `addElement()` always appends to the end (top of stack)

### UI side (`LayersPanel`)

- Displays elements in reverse order (top-most first) to match visual stacking
- Each row shows: type badge, name, visibility toggle, lock toggle, delete button
- Clicking a row selects the element
- Visibility toggle sets `element.visible` directly on the engine element
- Lock toggle sets `element.locked` — locked elements can't be selected or moved
- Delete removes the element from the engine

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

This ensures the exported image matches the canvas dimensions exactly, not the viewport size.
