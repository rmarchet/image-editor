# Phase 6: Persistence, Keyboard Shortcuts, and Polish

## Goal

Add the finishing touches that make the editor feel like a real application: project persistence via IndexedDB, comprehensive keyboard shortcuts, responsive canvas sizing, and deployment updates.

## IndexedDB Persistence (`utils/persistence.ts`)

### Why IndexedDB instead of localStorage

The old Fabric.js editor stored the entire image as a base64 data URL in `localStorage` under the key `imageEditor_lastImage`. This has two problems:
- **Size limit:** localStorage is capped at ~5–10 MB depending on the browser
- **Performance:** serializing/deserializing large base64 strings blocks the main thread

IndexedDB (via the `idb-keyval` library) supports binary `Blob` storage and has a much higher size limit (typically hundreds of MB).

### API

```ts
saveProject()            // saves canvas state + element snapshots to IndexedDB
loadProject()            // returns SavedProject or null
deleteProject()          // removes project + all associated image blobs
saveImageBlob(id, blob)  // stores an image blob with element ID prefix
loadImageBlob(id)        // retrieves a stored image blob
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

Image blobs are stored separately under keys prefixed with `imageEditor_img_` to keep the project metadata lightweight.

## Keyboard Shortcuts (`utils/shortcuts.ts`)

### Implementation

A single `keydown` listener registered on `window` at app mount. Returns a cleanup function for the React effect.

**Input guard:** Events are ignored when the target is `<input>`, `<textarea>`, or `contentEditable` — prevents shortcuts from firing during text editing.

**Key building:** Modifiers (`ctrl`, `meta`, `shift`, `alt`) + `event.key.toLowerCase()` joined with `+`.

### Shortcut Map

| Key Combination | Action |
|-----------------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Y` | Redo (alternative) |
| `Ctrl/Cmd + S` | Export/Save (prevents browser save dialog) |
| `Ctrl/Cmd + A` | Select all elements |
| `Delete` / `Backspace` | Delete selected elements |
| `Escape` | Switch to Select tool + deselect all |
| `V` | Select tool |
| `C` | Crop tool |
| `B` | Draw (brush) tool |
| `T` | Text tool |

### Arrow Key Nudging

Handled separately from the shortcut map via `handleArrowNudge()`:

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

The viewport transform (zoom/pan) is preserved across resizes. The user can call `fitToScreen()` via the bottom bar button to re-center.

### CSS Layout

- `CanvasHost` uses `flex: 1` + `overflow: hidden` to fill remaining space
- The PixiJS `<canvas>` element is appended as a child and fills the container
- The renderer is initialized with `autoDensity: true` for HiDPI display support

## CI/CD Updates

### `.github/workflows/deploy.yml`

Updated from the old Rollup build:
- Upgraded `actions/checkout` to v4, `actions/setup-node` to v4
- Added `yarn type-check` step before build
- Build command is now `yarn build` (which runs `tsc -b && vite build`)
- Deploy artifact is still `dist/` → GitHub Pages

## Performance Considerations

### Render loop

The PixiJS ticker runs continuously but the only per-frame work is `selection.drawOverlay(zoom)` — redrawing the selection bounding box and handles. The actual scene only re-renders when PixiJS detects changes to the scene graph.

### Zustand subscriptions

Stores use selective subscriptions — e.g., `useEditorStore((s) => s.zoom)` only re-renders the subscribing component when `zoom` changes, not when `activePanel` changes. This avoids the cascade re-renders that plagued the old React Context approach.

### Element snapshots

`syncElementsToStore()` serializes elements to plain objects (`ElementSnapshot[]`). This is only called after user actions (add, remove, transform end), not during continuous operations like drag. During drag, only the PixiJS scene graph is updated — the store sync happens on `pointerup`.

### Future optimizations (not yet implemented)

- **Dirty flag rendering:** Only call `app.renderer.render()` when the scene has changed
- **Object pooling:** Reuse `Graphics` instances for selection overlays instead of clearing/redrawing
- **Off-screen culling:** Skip rendering elements entirely outside the viewport
- **Texture atlasing:** Combine small textures into sprite sheets to reduce draw calls
