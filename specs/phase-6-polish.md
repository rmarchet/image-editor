# Phase 6: Persistence, Keyboard Shortcuts, and Polish

## Goal

Add production-grade persistence, keyboard ergonomics, responsive behavior, and deployment polish.

## Persistence

### IndexedDB (`src/utils/persistence.ts`)

### Why IndexedDB instead of localStorage

Legacy localStorage image persistence had two main issues:
- **Size limit:** localStorage is capped at ~5–10 MB depending on the browser
- **Performance:** serializing/deserializing large base64 strings blocks the main thread

IndexedDB (`idb-keyval`) is used for larger and non-blocking storage.

### API

```ts
saveProject()
loadProject()
deleteProject()
saveImageBlob(id, blob)
loadImageBlob(id)
```

### Data Model

```ts
interface SavedProject {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  elements: ElementSnapshot[];    // from elementStore
  savedAt: number;                // timestamp
}
```

### File-based project persistence (`src/utils/projectFile.ts`)

In the first iteration, persistence also includes portable `.ieproj` files:

- `saveProjectToFile()`
- `loadProjectFromFile(file)`

This path preserves element-level details (including filter metadata, scale, drawing strokes, and text style configuration).

## Keyboard Shortcuts (`utils/shortcuts.ts`)

### Implementation

A global `keydown` listener is registered once and cleaned up on unmount.

**Input guard:** Events are ignored when the target is `<input>`, `<textarea>`, or `contentEditable` — prevents shortcuts from firing during text editing.

**Key building:** Modifiers (`ctrl`, `meta`, `shift`, `alt`) + `event.key.toLowerCase()` joined with `+`.

### Shortcut Map

| Key Combination | Action |
|-----------------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo (alternative) |
| `Ctrl/Cmd + S` | Export image (prevents browser save dialog) |
| `Ctrl/Cmd + A` | Select all elements |
| `Delete` / `Backspace` | Delete selected elements |
| `Escape` | Switch to Select tool + deselect all |
| `V` | Select tool |
| `C` | Crop tool |
| `B` | Draw (brush) tool |
| `T` | Text tool |

### Arrow Key Nudging

Handled separately via `handleArrowNudge()`:

- `Arrow Up/Down/Left/Right` — moves all selected elements by 1px
- With `Shift` held — moves by 10px
- Calls `engine.syncElementsToStore()` and `selection.drawOverlay()` after moving
- Only fires when elements are selected

## Responsive Canvas

### `CanvasHost.tsx` ResizeObserver

A `ResizeObserver` is attached to the canvas host `<div>` on mount. When the container resizes (window resize, sidebar toggle, etc.):

1. Reads `entry.contentRect.width` and `height`
2. Calls `engine.resize(width, height)` which delegates to `app.renderer.resize()`
3. The PixiJS renderer adjusts its canvas element dimensions

Viewport transform is recalculated with fit logic after resizes to keep artboard framed.

### CSS Layout

- `CanvasHost` uses `flex: 1` + `overflow: hidden` to fill remaining space
- The PixiJS `<canvas>` element is appended as a child and fills the container
- The renderer is initialized with `autoDensity: true` for HiDPI display support

## CI/CD and Deployment

### `.github/workflows/deploy.yml`

Deployment workflow uses modern GitHub Actions:
- Upgraded `actions/checkout` to v4, `actions/setup-node` to v4
- Added `yarn type-check` step before build
- Build command is now `yarn build` (which runs `tsc -b && vite build`)
- Deploy step publishes `dist/` to GitHub Pages target repository

## Performance Considerations

### Render loop

The ticker performs minimal per-frame overlay redraw work; heavy serialization is deferred to action boundaries.

### Zustand subscriptions

Stores use selective subscriptions — e.g., `useEditorStore((s) => s.zoom)` only re-renders the subscribing component when `zoom` changes, not when `activePanel` changes. This avoids the cascade re-renders that plagued the old React Context approach.

### Element snapshots

`syncElementsToStore()` serializes elements to plain objects (`ElementSnapshot[]`). This is only called after user actions (add, remove, transform end), not during continuous operations like drag. During drag, only the PixiJS scene graph is updated — the store sync happens on `pointerup`.

### Future optimizations (not yet implemented)

- **Dirty flag rendering:** Only call `app.renderer.render()` when the scene has changed
- **Object pooling:** Reuse `Graphics` instances for selection overlays instead of clearing/redrawing
- **Off-screen culling:** Skip rendering elements entirely outside the viewport
- **Texture atlasing:** Combine small textures into sprite sheets to reduce draw calls
