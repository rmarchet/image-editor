# Phase 10: Toolbar, Filters, and Transform Consistency

## Goal

Close key editing consistency gaps across Toolbar controls, filter feedback UI, and transform interactions.

This phase focuses on making style edits more complete and transform behavior more predictable.

## Scope Summary

- text color editing from `Toolbar`
- drawing stroke color editing from `Toolbar`
- active filter visibility in `FiltersPanel`
- `Mixed` indicator for multi-selection with different filters
- opposite-corner resize anchoring consistency
- rotation centered on selected element (not canvas reference)

## 1. Toolbar: Text Color Editing

### Files

- `src/components/toolbar/Toolbar.tsx`
- `src/engine/history/commands.ts`

### Implementation

- Added text color control in the selected-text Toolbar section.
- Color updates route through `handleUpdateTextConfig({ fill })`.
- Undo/redo remains command-based via `UpdateTextConfigCommand`.

## 2. Toolbar: Drawing Stroke Color Editing

### Files

- `src/components/toolbar/Toolbar.tsx`
- `src/engine/elements/DrawingElement.ts`
- `src/engine/history/commands.ts`

### Implementation

- Added selected-drawing detection in `Toolbar`.
- Added `Line` color control for drawing elements.
- Color change applies to all strokes of the selected drawing element.
- Introduced `UpdateDrawingStrokesCommand` for undo/redo-safe stroke updates.
- Added `DrawingElement.updateStrokes(...)` API to apply and redraw stroke data updates.

## 3. FiltersPanel: Active and Mixed State

### Files

- `src/components/sidebar/panels/FiltersPanel.tsx`
- `src/engine/elements/BaseElement.ts`
- `src/types/index.ts`
- `src/engine/filters/FilterManager.ts`

### Implementation

- `ElementSnapshot` now includes `appliedFilterId`.
- Active filter button is highlighted when selected elements share the same filter.
- `None` is highlighted when no filter is applied.
- A `Mixed` indicator is shown for multi-selection with different filters.
- Filter apply/clear operations now call `engine.syncElementsToStore()` so UI updates immediately.

## 4. Resize Handle Anchoring Consistency

### File

- `src/engine/selection/TransformController.ts`

### Implementation

- Refactored resize calculations (`nw`, `ne`, `se`, `sw`) to keep the opposite corner anchored using start bounds captured in world space.
- Added a post-resize visual alignment pass so rendered bounds remain pinned to the intended anchor corner.
- Behavior is applied uniformly across selectable element types.

## 5. Rotation Center Fix

### File

- `src/engine/selection/TransformController.ts`

### Implementation

- Fixed coordinate-space mismatch in rotation angle calculation.
- Rotation center is computed from selected element bounds and converted to world coordinates.
- Rotation now behaves relative to the selected element center under zoom/pan.

## Verification Checklist

1. Text color changes are visible immediately and support undo/redo.
2. Drawing line color changes all strokes in selected drawing and supports undo/redo.
3. FiltersPanel shows active selection correctly and `Mixed` when needed.
4. Corner-resize keeps opposite corner visually anchored.
5. Rotation follows selected element center at different zoom/pan levels.
6. `yarn type-check` and `yarn build` pass.

## Outcome

Phase 10 improves day-to-day editing reliability: styling controls are more complete, filter feedback is explicit, and transform interactions are more aligned with expected design-tool behavior.
