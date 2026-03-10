# Phase 3: Polotno-Style UI Shell

## Goal

Build a sidebar-driven UI inspired by [Polotno Studio](https://studio.polotno.com/) using Chakra UI v3. The layout replaces the old Header/Canvas/Footer pattern with a professional design-tool interface: dark sidebar with icon navigation and expandable panels, a context-sensitive top toolbar, a central canvas viewport, and a bottom zoom bar.

## Layout Structure

```
┌──────┬──────────────────────────────────────────┐
│ Icon │ Panel   │        Top Toolbar              │
│ Bar  │ (250px) │  (context-sensitive controls)   │
│      │         ├────────────────────────────────────┤
│ 56px │ expand/ │                                  │
│      │ collapse│      Canvas Viewport             │
│      │         │      (PixiJS WebGL)              │
│      │         │                                  │
│      │         ├────────────────────────────────────┤
│      │         │        Bottom Bar (zoom)         │
└──────┴──────────────────────────────────────────┘
```

## Files

### `components/canvas/CanvasHost.tsx`

Mounts the PixiJS engine into a `<div>` ref.

- Calls `EditorEngine.getInstance().init(hostRef)` on mount
- Attaches a `ResizeObserver` to handle responsive sizing
- Calls `engine.resize(width, height)` on container size changes
- Returns cleanup: disconnects observer, calls `engine.destroy()`
- Styled: `flex: 1`, `bg: #e6e6e6`, `overflow: hidden`

### `components/sidebar/Sidebar.tsx`

Wrapper that renders `<IconBar />` + `<SidePanel />` (conditionally shown when a panel is active).

Reads `activePanel` from `editorStore`.

### `components/sidebar/IconBar.tsx`

Vertical strip of 7 panel buttons, 56px wide, dark background (`#1e1e2e`).

**Panels:**

| ID | Icon | Label |
|----|------|-------|
| `upload` | `BiUpload` | Upload |
| `text` | `BiText` | Text |
| `shapes` | `BiShapeSquare` | Shapes |
| `draw` | `BiPaint` | Draw |
| `layers` | `BiLayer` | Layers |
| `background` | `BiPalette` | Background |
| `filters` | `BiAdjust` | Filters |

Clicking a button calls `setActivePanel(id)` — toggles panel open/closed (same click closes).

Active state: lighter background (`#3a3a5e`), brighter text color (`#cdd6f4`).

### `components/sidebar/SidePanel.tsx`

Generic panel container, 250px wide, dark background with header showing the panel title.

Routes to the correct panel component via a map:

```ts
const panelComponents = { upload: UploadPanel, text: TextPanel, ... };
```

Content area scrolls independently (`overflowY: auto`).

### Sidebar Panels

#### `panels/UploadPanel.tsx`

- Drag-and-drop zone with dashed border, hover state with purple accent
- Click to open file picker (`<input type="file" accept="image/*">`)
- On file: creates `ImageElement.fromFile()`, scales to fit 80% of canvas, centers, adds to engine
- Shows list of uploaded file names below the drop zone

#### `panels/TextPanel.tsx`

Three preset buttons:
- Add Heading (48px, bold)
- Add Subheading (32px, bold)
- Add Body Text (18px, normal)

Each creates a `TextElement` centered on the canvas with the preset config.

#### `panels/ShapesPanel.tsx`

2-column grid of 4 shape buttons, each with a visual preview:
- Rectangle — bordered box
- Ellipse — bordered circle
- Line — angled line
- Arrow — arrow character

Each creates a `ShapeElement` centered on the canvas.

#### `panels/DrawPanel.tsx`

Controls for the draw tool:
- Toggle button (Start/Stop Drawing) — switches `activeTool` to/from `'draw'`
- Brush size slider (1–50px) with numeric display
- Color palette (8 preset swatches + highlight for active)
- Opacity slider (10–100%)

All values read from / write to `toolStore.drawConfig`.

#### `panels/LayersPanel.tsx`

Displays elements in reverse order (top-most first), each row showing:
- Type badge (3-letter abbreviation)
- Element name (truncated)
- Visibility toggle (`BiShow`/`BiHide`)
- Lock toggle (`BiLock`/`BiLockOpen`)
- Delete button (`BiTrash`)

Clicking a row selects the element via `engine.selection.selectById()`. Selected row gets highlighted background.

Empty state: "No elements yet" text.

#### `panels/BackgroundPanel.tsx`

- **Color presets:** 16 color swatches in a flex grid, active color highlighted with purple border
- **Custom color:** native `<input type="color">` picker
- **Canvas size:** width/height number inputs, styled to match sidebar theme

Calls `engine.updateCanvasBackground(color)` on color change.

#### `panels/FiltersPanel.tsx`

2-column grid of 10 WebGL filter presets (None, Grayscale, Sepia, Brighten, Contrast, Saturate, Desaturate, Invert, Blur, Hue Shift).

Requires at least one element selected — shows "Select an element to apply filters" otherwise.

Applies PixiJS `ColorMatrixFilter` or `BlurFilter` to `element.container.filters`.

### `components/toolbar/Toolbar.tsx`

Context-sensitive top bar, 48px tall, white background.

**Left section:**
- Tool buttons: Select, Crop (with active highlight)
- Divider
- Undo / Redo (disabled state based on `historyStore`)
- Divider
- When an element is selected:
  - Element type label
  - Flip H / Flip V buttons
  - Duplicate / Delete buttons
  - Divider
  - Property inputs: X, Y, W, H, rotation (compact number inputs, 52px wide)

**Right section:**
- Save button (purple accent)

Includes internal `ToolButton`, `PropInput`, and `Divider` sub-components.

### `components/common/BottomBar.tsx`

32px tall, white background, right-aligned.

- Zoom out button (`BiZoomOut`)
- Range slider (5–500%)
- Zoom in button (`BiZoomIn`)
- Zoom percentage label (monospace, e.g., "100%")
- Fit-to-screen button (`BiTargetLock`)

All zoom actions go through `engine.viewport.setZoom()`.

## Styling Approach

All styling uses Chakra UI primitives (`Box`, `Flex`, `VStack`, `SimpleGrid`, `Text`, `Heading`) with inline style props. No CSS files, no styled-components.

Color tokens from `src/app/theme.ts` are used directly as string values (e.g., `bg="#1e1e2e"`) rather than via semantic token references, for simplicity and readability.

## Responsive behavior

- Sidebar panel can be collapsed by clicking the active icon again
- Toolbar button labels hide below `md` breakpoint (icons only)
- Canvas viewport fills remaining space (`flex: 1`)
