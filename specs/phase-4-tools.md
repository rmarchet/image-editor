# Phase 4: Tool System

## Goal

Implement a unified tool system where each tool owns pointer semantics on the canvas. Only one tool is active at a time and `ToolManager` delegates events based on `toolStore.activeTool`.

## Architecture

```
useToolStore.activeTool changes
        │
        ▼
  ToolManager.switchTool()
        │
        ├── deactivate current tool
        └── activate new tool
              │
              ▼
        canvas pointer events
        ──────────────────────
        │ pointerdown  → tool.onPointerDown(worldX, worldY, event)
        │ pointermove  → tool.onPointerMove(worldX, worldY, event)
        │ pointerup    → tool.onPointerUp(worldX, worldY, event)
        │ keydown      → tool.onKeyDown(event)
```

All pointer coordinates are converted from screen space to world space via `viewport.screenToWorld()` before reaching the tool.

Panning (space+drag, middle-click) is handled by the `Viewport` at a higher priority — when `editorStore.isPanning` is true, tool events are suppressed.

## Files

### `engine/tools/BaseTool.ts`

Interface that all tools implement:

```ts
interface BaseTool {
  readonly name: string;
  engine: EditorEngine;
  activate(): void;
  deactivate(): void;
  onPointerDown?(worldX, worldY, event): void;
  onPointerMove?(worldX, worldY, event): void;
  onPointerUp?(worldX, worldY, event): void;
  onKeyDown?(event): void;
  onKeyUp?(event): void;
}
```

### `engine/tools/ToolManager.ts`

Orchestrates tool lifecycle.

**Construction:**
- Instantiates tools (`select`, `crop`, `draw`, `text`, `shape`) and registers them in a `Map<ToolType, BaseTool>`
- Subscribes to `useToolStore` — when `activeTool` changes, calls `switchTool()`
- Fires immediately with the initial tool state
- Registers a global `keydown` listener that delegates to the active tool
- Attaches pointer listeners to the canvas element

**Event delegation:**
- Converts screen coords to world coords
- Skips `pointerdown` if panning or middle-click
- Calls the active tool's corresponding method

**Cleanup:** `destroy()` removes all listeners and unsubscribes from store.

### `engine/tools/SelectTool.ts`

Default tool. Delegates to `SelectionManager` and `TransformController`.

**Activation:** Sets canvas cursor to `default`.

**Pointer events:**
- `pointerdown` → `transform.handlePointerDown()` (handles hit-testing, starts move/resize/rotate)
- `pointermove` → `transform.handlePointerMove()` (applies transform delta)
- `pointerup` → `transform.handlePointerUp()` + `syncElementsToStore()`

**Keyboard:** `Delete`/`Backspace` removes all selected elements.

**Deactivation:** Clears selection.

### `engine/tools/CropTool.ts`

Overlays a draggable crop region on a selected `ImageElement`.

**Activation:**
- Checks that a single `ImageElement` is selected; if not, switches back to Select
- Sets `toolStore.isCropping = true`
- Creates a `Graphics` overlay on `app.stage` (outside viewport, so it's in screen space)
- Initializes crop rect at 80% of the image bounds

**Overlay drawing:**
- Purple dashed border with semi-transparent fill
- 4 corner handles (white fill, purple stroke)
- Redrawn every frame accounting for viewport zoom/pan

**Pointer events:**
- Hit tests corner handles first (resize mode: `nw`/`ne`/`se`/`sw`)
- Falls back to body hit test (move mode)
- `pointermove` updates crop rect dimensions/position
- All dimensions clamped to minimum 20px

**Apply/Cancel:**
- `applyCrop()` — renders cropped region to `RenderTexture` and replaces element texture
- `cancelCrop()` — exits crop mode back to Select

Note: apply/cancel methods are implemented at tool level; UI wiring can be added/extended without changing engine API.

**Deactivation:** Removes the overlay `Graphics`, resets `isCropping`.

### `engine/tools/DrawTool.ts`

Freehand drawing using PixiJS `Graphics`.

**Activation:** Sets canvas cursor to `crosshair`.

**Pointer events:**
- `pointerdown` — creates a new `Graphics` instance, draws an initial dot at the start point, reads brush config from `toolStore.drawConfig`
- `pointermove` — `lineTo()` from last point to current point, strokes with configured color/size
- `pointerup` — commits a stroke-based `DrawingElement` and adds it to engine

**Brush config:** `brushSize` (1–50), `brushColor` (hex), `brushOpacity` (0.1–1.0) — all from `toolStore.drawConfig`.

Stroke data is persisted (`points`, `color`, `size`, `opacity`) so drawings can be serialized/deserialized.

### `engine/tools/TextTool.ts`

Click-to-place text element.

**Activation:** Sets canvas cursor to `text`.

**Pointer events:**
- `pointerdown` — creates a `TextElement` with default text "Edit me" at the clicked world position, adds to engine, selects it, switches to Select tool

This is intentionally minimal for placement; editing is handled by inline text session flow (`CanvasHost` + `textEditStore`) and toolbar style controls.

### `engine/tools/ShapeTool.ts`

Click-and-drag to draw shapes.

**Activation:** Sets canvas cursor to `crosshair`.

**Pointer events:**
- `pointerdown` — creates a `ShapeElement` at click position with shape type from `toolStore.shapeConfig`, initial size 1x1, adds to engine
- `pointermove` — calculates width/height from drag delta, repositions element center to midpoint of start/current
- `pointerup` — if shape is smaller than 10x10, snaps to default 200x150; selects the element, syncs to store, switches to Select tool

## Tool Activation Sources

Tools can be activated from multiple places:
- **Toolbar buttons:** Select, Crop
- **Sidebar panels:** Draw panel toggle, Shape panel click (auto-activates ShapeTool)
- **Keyboard shortcuts:** `V` (Select), `C` (Crop), `B` (Draw), `T` (Text)
- **Programmatic:** Tools switch themselves (e.g., TextTool → Select after placing)

All go through `useToolStore.setActiveTool()`, which the `ToolManager` subscribes to.
