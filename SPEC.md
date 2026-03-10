# Image Editor — Project Specification

## Overview

A browser-based image editor built with **React 18**, **PixiJS v8** (WebGL-accelerated), **Chakra UI v3**, and **TypeScript**. Features a Polotno-inspired sidebar-driven UI with support for images, text, shapes, freehand drawing, WebGL filters, and full undo/redo history.

**Live deployment:** GitHub Pages via manual `workflow_dispatch`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI framework | React 18 (JSX transform) |
| Canvas / rendering | PixiJS v8 (WebGL) — used imperatively, not via @pixi/react |
| UI components | Chakra UI v3 + @emotion/react |
| State management | Zustand 5 (multiple stores, no Context providers) |
| Icons | react-icons (BoxIcons set, `bi` prefix) |
| Persistence | idb-keyval (IndexedDB) |
| Bundler | Vite 7 |
| Language | TypeScript 5, strict mode, target ES2020, JSX react-jsx |
| Node version | 20 (see `.nvmrc`) |
| Package manager | yarn (lockfile committed) |
| CI/CD | GitHub Actions → GitHub Pages |

## Project Structure

```
src/
├── main.tsx                          # ReactDOM.createRoot entry point
├── app/
│   ├── App.tsx                       # Root layout: Sidebar + Toolbar + Canvas + BottomBar
│   └── theme.ts                      # Chakra UI custom system/theme
├── components/
│   ├── canvas/
│   │   └── CanvasHost.tsx            # Mounts PixiJS Application, handles resize
│   ├── sidebar/
│   │   ├── Sidebar.tsx               # IconBar + SidePanel wrapper
│   │   ├── IconBar.tsx               # Vertical icon strip (dark)
│   │   ├── SidePanel.tsx             # Expandable panel container
│   │   └── panels/
│   │       ├── UploadPanel.tsx       # Drag-drop image upload
│   │       ├── TextPanel.tsx         # Add heading/subheading/body
│   │       ├── ShapesPanel.tsx       # Rectangle, ellipse, line, arrow
│   │       ├── DrawPanel.tsx         # Brush config (size, color, opacity)
│   │       ├── LayersPanel.tsx       # Element list with visibility/lock/delete
│   │       ├── BackgroundPanel.tsx   # Canvas color + size controls
│   │       └── FiltersPanel.tsx      # WebGL filter presets
│   ├── toolbar/
│   │   └── Toolbar.tsx               # Context-sensitive top toolbar
│   └── common/
│       └── BottomBar.tsx             # Zoom slider + fit-to-screen
├── engine/                           # Framework-agnostic PixiJS engine
│   ├── core/
│   │   ├── EditorEngine.ts           # Singleton: PixiJS Application, scene graph, element management
│   │   └── Viewport.ts              # Zoom (wheel), pan (space+drag / middle-click)
│   ├── elements/
│   │   ├── BaseElement.ts           # Abstract base: position, size, rotation, opacity, lock, visible
│   │   ├── ImageElement.ts          # Sprite-based image with fromURL/fromFile
│   │   ├── TextElement.ts           # PixiJS Text with font/style config
│   │   └── ShapeElement.ts          # Graphics-based shapes (rect, ellipse, line, arrow)
│   ├── selection/
│   │   ├── SelectionManager.ts      # Multi-select, hit-testing, bounding-box overlay
│   │   └── TransformController.ts   # Move, resize (corner handles), rotate interactions
│   ├── tools/
│   │   ├── BaseTool.ts              # Tool interface
│   │   ├── ToolManager.ts           # Registry, store subscription, pointer delegation
│   │   ├── SelectTool.ts            # Default: select, move, resize, rotate, delete
│   │   ├── CropTool.ts             # Crop overlay on image elements
│   │   ├── DrawTool.ts             # Freehand drawing with configurable brush
│   │   ├── TextTool.ts             # Click to place text element
│   │   └── ShapeTool.ts            # Click-drag to draw shapes
│   ├── filters/
│   │   └── FilterManager.ts        # Presets using ColorMatrixFilter, BlurFilter, NoiseFilter
│   └── history/
│       ├── Command.ts              # Command interface: execute, undo, redo
│       ├── HistoryManager.ts       # Delegates to history store
│       └── commands.ts             # MoveCommand, ResizeCommand, RotateCommand, AddElement, RemoveElement, Reorder, Transform
├── stores/
│   ├── editorStore.ts              # zoom, canvasSize, backgroundColor, activePanel, isPanning
│   ├── toolStore.ts                # activeTool, drawConfig, shapeConfig, isCropping
│   ├── elementStore.ts             # elements[], selectedIds[], CRUD + reorder
│   └── historyStore.ts             # undoStack, redoStack, push/undo/redo/clear
├── types/
│   └── index.ts                    # ToolType, ShapeType, SidebarPanel, ElementSnapshot, etc.
└── utils/
    ├── export.ts                   # PNG/JPEG export via renderer.extract
    ├── persistence.ts              # IndexedDB project save/load via idb-keyval
    └── shortcuts.ts                # Global keyboard shortcut handler
```

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Zustand Stores                        │
│  editorStore  |  toolStore  |  elementStore  |  history  │
└──────────────────────────────────────────────────────────┘
        ▲                                        │
        │ reads state                  drives     │
        │                                        ▼
┌───────────────┐                     ┌─────────────────────┐
│  React UI     │                     │  PixiJS Engine      │
│  (Chakra UI)  │ ── dispatches ──▶   │  (imperative)       │
│  Sidebar,     │                     │  EditorEngine,      │
│  Toolbar,     │                     │  Viewport, Tools,   │
│  BottomBar    │                     │  Selection, Filters │
└───────────────┘                     └─────────────────────┘
        │                                        ▲
        └───── mounts canvas via CanvasHost ─────┘
```

### Key Design Decisions

- **PixiJS used imperatively** — React owns the UI shell; PixiJS canvas is mounted into a host div and controlled via `EditorEngine.getInstance()`
- **Zustand stores as bridge** — UI reads state via hooks; engine writes state via `store.getState()` outside React
- **Singleton engine** — `EditorEngine.getInstance()` provides global access from both UI and engine code
- **Command pattern history** — each action produces a reversible `Command` object instead of full canvas snapshots
- **Framework-agnostic engine** — `src/engine/` has zero React imports; it depends only on PixiJS and Zustand stores

### Scene Graph

```
app.stage
├── viewport (Container) — scaled/translated for zoom/pan
│   ├── canvasBg (Graphics) — white rectangle with border
│   └── elementsLayer (Container)
│       ├── element 0
│       ├── element 1
│       └── ...
└── overlayLayer (Container) — selection handles at screen coords
```

### Tool Lifecycle

1. User clicks tool in Toolbar or sidebar → `useToolStore.setActiveTool()`
2. `ToolManager` detects store change → deactivates current tool, activates new one
3. Active tool receives pointer events via `ToolManager`'s canvas listeners
4. On completion, tool updates elements and syncs to store

## Implemented Features

| Feature | Implementation |
|---------|---------------|
| Image upload | Drag-drop / click in UploadPanel; `ImageElement.fromFile()` |
| Text | TextPanel presets; `TextElement` with font config |
| Shapes | ShapesPanel grid; `ShapeElement` (rect, ellipse, line, arrow) |
| Freehand draw | DrawTool with configurable brush size/color/opacity |
| Crop | CropTool with draggable overlay, apply/cancel |
| Select/Move/Resize/Rotate | SelectTool + TransformController with corner handles |
| Flip H/V | Toolbar buttons; scale.x/y *= -1 |
| Layers | LayersPanel with visibility, lock, delete, z-order display |
| Background | BackgroundPanel with color presets + custom picker + canvas size |
| Filters | FiltersPanel with WebGL presets (grayscale, sepia, blur, etc.) |
| Undo/Redo | Command-based history (historyStore + Command interface) |
| Zoom/Pan | Scroll wheel zoom, space+drag pan, zoom slider |
| Export | PNG download via `renderer.extract` |
| Persistence | IndexedDB via idb-keyval |
| Keyboard shortcuts | Ctrl+Z/Y, Delete, arrow nudge, V/C/B/T tool shortcuts |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `C` | Crop tool |
| `B` | Draw (brush) tool |
| `T` | Text tool |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` / `Ctrl/Cmd + Y` | Redo |
| `Ctrl/Cmd + S` | Export/Save |
| `Ctrl/Cmd + A` | Select all |
| `Delete` / `Backspace` | Delete selected |
| `Escape` | Deselect / switch to Select tool |
| `Arrow keys` | Nudge selection 1px (10px with Shift) |
| `Space + drag` | Pan viewport |
| `Scroll wheel` | Zoom viewport |

## Build & Dev

```bash
yarn install          # install deps
yarn dev              # dev server on http://localhost:5173
yarn build            # production build → dist/
yarn type-check       # tsc --noEmit
yarn preview          # preview production build
```

## Conventions

- **Components** are functional React components with hooks
- **Engine code** (`src/engine/`) is framework-agnostic — no React imports
- **State** flows through Zustand stores, never React Context
- **Element at index 0** in `elementsLayer` is the bottom-most; last is top-most
- **No tests** — no test framework or test files exist
- **Styling** uses Chakra UI primitives (Box, Flex, etc.) with inline style props
- **PixiJS v8 API** — uses named imports (`import { Application, Sprite } from 'pixi.js'`)
