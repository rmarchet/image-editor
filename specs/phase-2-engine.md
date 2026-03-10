# Phase 2: Core Rendering Engine

## Goal

Build the framework-agnostic PixiJS v8 rendering engine that replaces Fabric.js. This phase establishes the scene graph, viewport (zoom/pan), element abstraction hierarchy, selection system, and transform interactions. All code lives in `src/engine/` with zero React imports.

## Architecture Overview

```
app.stage
├── viewport (Container) — scaled/translated for zoom/pan
│   ├── canvasBg (Graphics) — white rectangle representing the canvas
│   └── elementsLayer (Container)
│       ├── element 0 (bottom)
│       ├── element 1
│       └── element N (top)
└── overlayLayer (Container) — selection handles at screen coordinates
```

The separation between `viewport` and `overlayLayer` ensures selection handles remain a constant visual size regardless of zoom level.

## Files

### `engine/core/EditorEngine.ts`

The central singleton that owns everything.

**Responsibilities:**
- Creates and initializes the PixiJS `Application` (WebGL renderer, antialiased, DPR-aware)
- Appends the `<canvas>` element to a host `<div>` provided by `CanvasHost`
- Creates the scene graph: `viewport` → `canvasBg` + `elementsLayer`; `overlayLayer` for selection
- Instantiates `Viewport`, `SelectionManager`, `TransformController`, `ToolManager`
- Manages the element array: `addElement()`, `removeElement()`, `getElement()`, `getElements()`, `reorderElement()`
- Syncs element snapshots to `elementStore` via `syncElementsToStore()`
- Draws the canvas background (white rect with border) based on `editorStore` dimensions/color
- Runs the render loop (`app.ticker`) to continuously redraw selection overlays
- Handles `resize()` for responsive canvas and `fitToScreen()` to center content

**Access pattern:** `EditorEngine.getInstance()` — available from both React UI and engine code.

### `engine/core/Viewport.ts`

Zoom and pan controller.

**Zoom:**
- Scroll wheel with pivot-point zoom (zooms toward cursor position)
- Clamped to 0.05x–20x range
- Updates `editorStore.setZoom()` on every change

**Pan:**
- Space + left-click drag, or middle-click drag
- Updates `editorStore.isPanning` to suppress tool pointer events during pan
- Cursor changes: `grab` when space held, `grabbing` while dragging

**API:**
- `setZoom(zoom, pivotX?, pivotY?)` — programmatic zoom with optional pivot
- `fitContent(contentWidth, contentHeight)` — calculates zoom/pan to fit content with 60px padding
- `screenToWorld(screenX, screenY)` → `{ x, y }` — converts screen coordinates to world space
- `worldToScreen(worldX, worldY)` → `{ x, y }` — inverse

**Event cleanup:** All DOM listeners are removed in `destroy()`.

### `engine/elements/BaseElement.ts`

Abstract base class for all canvas elements.

**Properties (get/set):**
- `id` (readonly, auto-generated `el-N`)
- `type` (readonly string)
- `x`, `y` — maps to `container.x`, `container.y`
- `width`, `height` — abstract, implemented by subclasses
- `rotation` — degrees, internally stored as radians on `container.rotation`
- `opacity` — maps to `container.alpha`, clamped 0–1
- `locked` — disables `eventMode` and changes cursor
- `visible` — maps to `container.visible`
- `name` — display name for the layers panel

**Methods:**
- `toSnapshot()` — returns an `ElementSnapshot` for store serialization
- `destroy()` — destroys the PixiJS container and children

**PixiJS setup:** Each element owns a `Container` with `eventMode: 'static'` and `cursor: 'pointer'`.

### `engine/elements/ImageElement.ts`

Extends `BaseElement`. Wraps a PixiJS `Sprite`.

- `width`/`height` map to `sprite.width`/`sprite.height`
- `container.pivot` is set to center for centered rotation
- `setTexture(texture)` — replaces the sprite texture (used by crop)
- `static fromURL(url)` — loads via `Assets.load<Texture>()`, returns `ImageElement`
- `static fromFile(file)` — reads file via `FileReader.readAsDataURL()`, then calls `fromURL()`

### `engine/elements/TextElement.ts`

Extends `BaseElement`. Wraps a PixiJS `Text`.

- Configurable: `text`, `fontFamily`, `fontSize`, `fill`, `fontWeight`, `fontStyle`, `align`
- Word-wrap enabled with configurable width
- `updateConfig(updates)` — partial update, rebuilds `TextStyle`
- Pivot set to center for centered rotation

### `engine/elements/ShapeElement.ts`

Extends `BaseElement`. Wraps a PixiJS `Graphics`.

- Supports `rectangle`, `ellipse`, `line`, `arrow` via `ShapeType`
- Configurable fill color, stroke color, stroke width, dimensions
- `draw()` — clears and redraws based on current config
- `updateConfig(updates)` — partial update, triggers redraw
- Pivot set to center

## Selection System

### `engine/selection/SelectionManager.ts`

**Tracks:** Array of selected `BaseElement` instances.

**Hit testing:** `hitTest(worldX, worldY)` iterates elements top-to-bottom, checks bounding box, skips locked/hidden.

**Handle hit testing:** `hitTestHandle(screenX, screenY, zoom)` checks proximity to corner handles (`nw`, `ne`, `se`, `sw`) and rotation handle.

**Overlay drawing:** `drawOverlay(zoom)` renders per-selected-element:
- Bounding box rectangle (purple border)
- 4 corner resize handles (white fill, purple stroke) — sized inversely to zoom
- Rotation handle (circle above top center, connected by a line) — only for single selection

**Store sync:** `syncToStore()` updates `elementStore.setSelectedIds()`.

### `engine/selection/TransformController.ts`

Handles pointer interactions for transforming selected elements.

**Transform modes:** `move`, `resize-nw`, `resize-ne`, `resize-se`, `resize-sw`, `rotate`

**Flow:**
1. `handlePointerDown` — checks handle hit first, then element hit; captures start state
2. `handlePointerMove` — applies delta based on mode (translate, scale, or angle calculation)
3. `handlePointerUp` — fires `onTransformEnd` callback with before/after snapshots

**Callbacks:** `onTransformStart` and `onTransformEnd` — used by tools to create history commands.

## Design Decisions

- **Singleton pattern** for `EditorEngine` — simplifies access from any part of the codebase without prop drilling or context
- **Pivot at center** for all elements — rotation and scaling behave intuitively
- **Overlay in screen space** — selection handles outside the viewport container so they don't scale with zoom
- **Abstract element class** — makes adding new element types (video, SVG, etc.) straightforward
