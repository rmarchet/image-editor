# Phase 9: Zoom Controls and Centered Viewport

## Goal

Refresh viewport interactions to feel closer to professional editors: compact `- / % / +` controls in the bottom bar, preset-based zoom selection, and standard wheel-modifier navigation.

## Scope Summary

This phase replaces the slider-based zoom UI and aligns all user zoom actions around a center pivot strategy.

- remove range slider from `BottomBar`
- keep `-` and `+` zoom buttons
- add zoom percentage dropdown menu with presets (`10%` to `500%`)
- add `Reset` action in the dropdown (mapped to fit-to-screen)
- remove dedicated fit button from `BottomBar`
- standardize wheel interactions:
  - wheel: vertical pan
  - `Shift + wheel`: horizontal pan
  - `Alt + wheel`: centered zoom

## 1. Bottom Bar Control Redesign

### File

- `src/components/common/BottomBar.tsx`

### Changes

- replaced slider + static zoom label with a menu trigger showing live zoom percentage
- menu preset options:
  - `10%`, `25%`, `50%`, `75%`, `100%`, `125%`, `150%`, `200%`, `300%`, `400%`, `500%`
- added `Reset` menu action that calls `engine.fitToScreen()`
- removed the separate target/fit icon button
- kept compact icon buttons for zoom out/in (`-` and `+`) and existing multiplicative behavior (`0.8x`, `1.2x`)

## 2. Center-Pivot Zoom API in Viewport

### File

- `src/engine/core/Viewport.ts`

### New Helpers

- `getCenterPoint()`
  - returns renderer-space center point
- `setZoomAtCenter(zoom)`
  - calls existing `setZoom(zoom, pivotX, pivotY)` using renderer center

These helpers avoid duplicating pivot math in UI components and keep zoom behavior consistent across inputs.

## 3. Wheel Interaction Update

### File

- `src/engine/core/Viewport.ts`

### Change

- `onWheel` is now mode-based:
  - default wheel scroll pans vertically
  - `Shift + wheel` pans horizontally
  - `Alt + wheel` triggers zoom in/out
- zoom path keeps center pivot via `setZoomAtCenter(...)`

Result: viewport navigation matches common desktop editor ergonomics while keeping centered zoom behavior for explicit zoom intent.

## 4. UX Notes

- the zoom trigger always reflects current zoom percentage, including non-preset values (for example `144%`)
- `Reset` is intentionally semantic (fit content), not simply `100%`
- overlays/selection rendering remain compatible because they already consume `viewport.zoom`

## Outcome

By the end of Phase 9, the editor provides a cleaner Polotno-style zoom control pattern plus standard wheel-driven navigation (`vertical`, `horizontal`, `zoom with Alt`).
