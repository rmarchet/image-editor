# Phase 2: Core Rendering Engine

## Goal

Implement a framework-agnostic PixiJS engine that owns rendering, scene graph, viewport transforms, element lifecycle, and selection overlays.

## Scene Graph

```
app.stage
├── viewport
│   ├── canvasBg
│   └── elementsLayer
└── overlayLayer
```

- `viewport` is transformed for zoom/pan
- `overlayLayer` stays in screen space for stable handle size

## Engine Core (`src/engine/core/EditorEngine.ts`)

Responsibilities:

- initialize/destroy Pixi `Application`
- host canvas in `CanvasHost`
- manage element list and display order
- connect `Viewport`, `SelectionManager`, `TransformController`, `ToolManager`
- sync snapshots to `elementStore`
- draw artboard background from `editorStore`
- fit/reflow on resize

Utility APIs:

- `addElement`, `removeElement`, `getElement`, `getElements`, `reorderElement`
- `duplicateSelected`
- `setCanvasSize`, `updateCanvasBackground`, `fitToScreen`

## Viewport (`src/engine/core/Viewport.ts`)

- wheel interactions:
	- wheel: vertical pan
	- `Shift + wheel`: horizontal pan
	- `Alt + wheel`: centered zoom
- pan via `Space + drag` or middle mouse
- coordinate transforms:
	- `screenToWorld`
	- `worldToScreen`
- editor panning state is propagated to `editorStore`

## Element Model

### `BaseElement` (`src/engine/elements/BaseElement.ts`)

Shared state:

- geometry: `x`, `y`, `width`, `height`, `rotation`
- visibility/control: `opacity`, `locked`, `visible`, `name`
- persisted filter metadata: `appliedFilterId`

Common methods:

- `toSnapshot()`
- `clone()` (overridable)
- `destroy()`

### Implemented element types

- `ImageElement`: sprite-based image with source URL tracking
- `TextElement`: configurable text rendering (`align`, `fontWeight`, `fontStyle`, `strikethrough`)
- `ShapeElement`: procedural graphics for
	- rectangle, ellipse, line, arrow
	- star, triangle, pentagon, hexagon, heart
- `DrawingElement`: persisted stroke-based freehand drawing

## Selection and Transform

### `SelectionManager`

- stores selected elements
- hit-tests top-to-bottom in screen space
- handle hit-test for corners + rotation handle
- draws bounds and handles in overlay layer

### `TransformController`

Supported modes:

- `move`
- `resize-nw`, `resize-ne`, `resize-se`, `resize-sw`
- `rotate`

Flow:

1. pointer down: choose handle or element
2. pointer move: apply transform
3. pointer up: finalize and emit before/after snapshots

## Design Notes

- singleton access for engine (`EditorEngine.getInstance()`)
- center pivot defaults for predictable transforms
- separation of world layer and overlay layer keeps controls readable at any zoom
