# Phase 13 - Extended History Coverage

## Overview

Phase 13 extends undo/redo to all meaningful editing actions performed by users in canvas, toolbar, side panels, and keyboard shortcuts.

The goal is functional consistency: if an action changes the document state, it should be reversible with Undo and repeatable with Redo.

---

## Scope Summary

Covered in this phase:
- element creation across tools and sidebar panels
- element deletion from toolbar, layers panel, and keyboard shortcuts
- move/resize/rotate transforms from direct manipulation and numeric inputs
- keyboard arrow nudging with grouped history batching
- flip, duplicate, shape style updates, and filter application
- canvas background color and canvas size updates

Intentionally excluded:
- layer visibility and lock toggles

---

## 1. History Infrastructure Enhancements

### Store-level history recording

Files:
- `src/stores/historyStore.ts`
- `src/engine/history/HistoryManager.ts`

Implemented:
- Added `record(command)` to append commands without re-running `execute()`.
- Kept `push(command)` for operations that must execute immediately.
- Exposed the same behavior through `HistoryManager`.

This enables clean tracking of already-applied interactive operations (for example drag end and nudge batches).

### Engine support for reversible remove/restore

File:
- `src/engine/core/EditorEngine.ts`

Implemented:
- Added `softRemoveElement(id)` (remove from scene/state without destroying Pixi object).
- Added `reattachElement(element, index)` (restore at original z-order position).
- Updated `duplicateSelected()` to return duplicated elements for history tracking.

---

## 2. Command Layer Expansion

File:
- `src/engine/history/commands.ts`

Implemented:
- Updated `AddElementCommand` undo path to use non-destructive removal.
- Reworked `RemoveElementCommand` to capture original index and restore exact layer order.
- Added `BatchCommand` for single-step undo on grouped actions.
- Added `FlipCommand` for horizontal/vertical flipping.
- Added `UpdateShapeConfigCommand` for shape style updates.
- Added `UpdateFilterCommand` for filter changes by filter ID.
- Added `UpdateCanvasBackgroundCommand` for canvas color changes.
- Added `UpdateCanvasSizeCommand` for canvas resize operations.
- Added `DuplicateCommand` to manage duplicate undo/redo lifecycle.

---

## 3. Element Lifecycle Coverage (Create/Delete)

### Creation now tracked by history

Files:
- `src/engine/tools/DrawTool.ts`
- `src/engine/tools/ShapeTool.ts`
- `src/engine/tools/TextTool.ts`
- `src/components/sidebar/panels/ShapesPanel.tsx`
- `src/components/sidebar/panels/TextPanel.tsx`
- `src/components/sidebar/panels/UploadPanel.tsx`

Implemented:
- Replaced direct `addElement()` calls with history commands.
- Shape drawing records creation when the shape operation completes.

### Deletion now tracked by history

Files:
- `src/components/toolbar/Toolbar.tsx`
- `src/components/sidebar/panels/LayersPanel.tsx`
- `src/utils/shortcuts.ts`
- `src/engine/tools/SelectTool.ts`

Implemented:
- Replaced direct delete mutations with `RemoveElementCommand`.
- Added `BatchCommand` support for multi-delete as one undo step.
- Removed duplicate delete logic from `SelectTool` so global shortcuts remain the single source of truth.

---

## 4. Transform History Coverage

### Direct manipulation (drag/resize/rotate)

File:
- `src/engine/tools/SelectTool.ts`

Implemented:
- Wired `TransformController` completion callback to record `TransformCommand` only when values changed.

### Numeric transforms from toolbar

Files:
- `src/components/toolbar/Toolbar.tsx`
- `src/components/toolbar/PropInput.tsx`

Implemented:
- Added focus/blur transform snapshots for `x`, `y`, `W`, `H`, and rotation inputs.
- Recorded transform updates at commit time (blur), preserving single-step undo behavior.

### Keyboard nudge (arrow keys)

File:
- `src/utils/shortcuts.ts`

Implemented:
- Added nudge batching with debounce window.
- Multiple consecutive arrow presses are grouped into one history entry.
- Added batch flush before non-arrow shortcuts and pointer interactions to preserve predictable undo order.

---

## 5. Property and Style Changes Coverage

### Toolbar action history

File:
- `src/components/toolbar/Toolbar.tsx`

Implemented:
- Flip H/V now tracked.
- Duplicate now tracked.
- Shape fill/stroke/stroke-width updates now tracked.
- Existing text and drawing style history integrations preserved.

### Filters history

File:
- `src/components/sidebar/panels/FiltersPanel.tsx`

Implemented:
- Filter application now records before/after filter IDs.
- Multi-selection filter changes are grouped as one undo step.

---

## 6. Canvas State Coverage

Files:
- `src/components/sidebar/panels/BackgroundPanel.tsx`
- `src/components/sidebar/panels/SettingsPanel.tsx`

Implemented:
- Preset background color changes are undoable.
- Custom color picker changes are previewed live and committed as a single history step on blur.
- Canvas width/height edits are undoable.
- Canvas preset size changes are undoable.

---

## Technical File Summary

| File | Feature contribution |
|------|----------------------|
| `src/stores/historyStore.ts` | Added `record()` for non-executing history insertion |
| `src/engine/history/HistoryManager.ts` | Exposed `record()` API |
| `src/engine/history/commands.ts` | Added/updated command set for full history coverage |
| `src/engine/core/EditorEngine.ts` | Soft remove, reattach, duplicate return payload |
| `src/engine/tools/DrawTool.ts` | Drawing creation history |
| `src/engine/tools/ShapeTool.ts` | Shape creation completion history |
| `src/engine/tools/TextTool.ts` | Text creation history |
| `src/engine/tools/SelectTool.ts` | Transform-end history recording |
| `src/components/sidebar/panels/ShapesPanel.tsx` | Sidebar shape creation history |
| `src/components/sidebar/panels/TextPanel.tsx` | Sidebar text creation history |
| `src/components/sidebar/panels/UploadPanel.tsx` | Image placement history |
| `src/components/sidebar/panels/LayersPanel.tsx` | Layer delete history |
| `src/components/sidebar/panels/FiltersPanel.tsx` | Filter apply history |
| `src/components/sidebar/panels/BackgroundPanel.tsx` | Background color history |
| `src/components/sidebar/panels/SettingsPanel.tsx` | Canvas size history |
| `src/components/toolbar/PropInput.tsx` | Focus/blur hooks for transform commit |
| `src/components/toolbar/Toolbar.tsx` | Delete/flip/duplicate/style/transform history coverage |
| `src/utils/shortcuts.ts` | Delete + batched arrow nudge keyboard history |

---

## Verification Checklist

1. Add elements from each creation entry point (draw, shape tool, text tool, upload panel, shape/text panels) and verify Undo/Redo.
2. Delete one element and verify Undo restores exact element state.
3. Delete multiple elements and verify one Undo restores the full group.
4. Drag, resize, and rotate an element; verify one Undo reverts each completed transform.
5. Edit `x/y/W/H/°` from toolbar inputs and verify Undo reverts committed values.
6. Press arrow keys repeatedly to nudge and verify one Undo reverts the full nudge batch.
7. Use Flip H/V and verify Undo toggles back correctly.
8. Duplicate selected elements and verify Undo removes duplicates.
9. Change shape style values and verify Undo restores previous style.
10. Apply filters (single and multi-selection) and verify Undo restores previous filter state.
11. Change canvas background with presets and custom picker; verify Undo behavior.
12. Change canvas size with numeric fields and presets; verify Undo behavior.
13. Confirm Undo/Redo keyboard shortcuts still work consistently after mixed action sequences.

---

## Outcome

Phase 13 upgrades history from partial support to broad, user-facing coverage across core editing flows, including keyboard-driven interactions. Undo/redo behavior is now aligned with the majority of meaningful document mutations.
