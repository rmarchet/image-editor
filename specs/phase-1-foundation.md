# Phase 1: Project Foundation

## Goal

Replace the Rollup + Fabric.js + styled-components stack with a modern Vite + PixiJS v8 + Chakra UI v3 + Zustand foundation. Establish the folder structure, dependency tree, build pipeline, and TypeScript configuration that every subsequent phase builds on.

## What Changed (before vs. after)

| Concern | Before | After |
|---------|--------|-------|
| Bundler | Rollup 4.9 (`rollup.config.mjs`, IIFE output) | Vite 7 (`vite.config.ts`, ESM output) |
| Rendering | Fabric.js 5.3 (Canvas 2D) | PixiJS v8 (WebGL) |
| UI components | styled-components 6 + plain CSS files | Chakra UI v3 + @emotion/react |
| State management | React Context (`EditorContext`) | Zustand 5 (multiple stores) |
| TypeScript | `target: es5`, `jsx: react`, `baseUrl: src` | `target: ES2020`, `jsx: react-jsx`, `paths: @/*` |
| Entry point | `src/index.tsx` → `ReactDOM.render` | `src/main.tsx` → `createRoot` |
| Node | 20 (unchanged) | 20 (unchanged) |
| Package manager | yarn (unchanged) | yarn (unchanged) |

## Dependencies Installed

### Runtime

- `pixi.js` ^8.x — WebGL rendering engine
- `@chakra-ui/react` + `@emotion/react` — UI component library (v3)
- `zustand` ^5.x — lightweight state management
- `react` ^19, `react-dom` ^19 — UI framework
- `react-icons` ^5.x — icon set (BoxIcons, `bi` prefix)
- `idb-keyval` ^6.x — IndexedDB key-value persistence

### Dev

- `vite` ^7.x — build tool + dev server
- `@vitejs/plugin-react` — React JSX/refresh support
- `typescript` ^5.x — type checking
- `@types/react`, `@types/react-dom`, `@types/node`

## Dependencies Removed

- `fabric`, `@types/fabric`
- `styled-components`
- `rollup` and all `@rollup/*` / `rollup-plugin-*` packages

## Files Created / Modified

### Build & config

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite config with `@vitejs/plugin-react`, `@/` alias, dev server on port 5173 |
| `tsconfig.json` | Updated: `target: ES2020`, `moduleResolution: bundler`, `jsx: react-jsx`, `paths: { "@/*": ["src/*"] }` |
| `index.html` | Moved from `public/` to project root (Vite convention); references `/src/main.tsx` |
| `vite-env.d.ts` | Vite client type reference |
| `package.json` | `"type": "module"`, new scripts (`dev`, `build`, `preview`, `type-check`), updated deps |

### Files removed

- `rollup.config.mjs`
- `public/index.html` (moved to root)
- Entire old `src/` directory (components, context, utils, styles)

### Folder structure created

```
src/
  app/                    # App shell, layout, providers
  components/
    sidebar/              # Left sidebar panels
      panels/
    toolbar/              # Top context toolbar
    canvas/               # Canvas host (mounts PixiJS)
    common/               # Shared UI pieces
  engine/                 # PixiJS rendering engine (framework-agnostic)
    core/
    tools/
    elements/
    filters/
    history/
    selection/
  stores/                 # Zustand stores
  types/                  # Shared TypeScript types
  utils/                  # Helpers
```

## Zustand Store Design

Four stores, each with a single responsibility:

### `editorStore` (`src/stores/editorStore.ts`)

Canvas-level state: zoom, canvas dimensions, background color, active sidebar panel, panning flag.

### `toolStore` (`src/stores/toolStore.ts`)

Active tool (`ToolType`), draw brush config (size, color, opacity), shape config (type, fill, stroke), cropping flag.

### `elementStore` (`src/stores/elementStore.ts`)

Element snapshots array, selected element IDs. CRUD operations: add, remove, update, select, deselect, reorder.

### `historyStore` (`src/stores/historyStore.ts`)

Undo/redo stacks of `Command` objects (max 50). Exposes `push`, `undo`, `redo`, `clear`.

## Chakra UI Theme (`src/app/theme.ts`)

Custom design tokens for a Polotno-inspired look:

- **Sidebar:** dark background (`#1e1e2e`), muted text (`#6c7086`), active highlight (`#3a3a5e`)
- **Canvas area:** light gray (`#e6e6e6`)
- **Toolbar:** white background, light border
- **Accent:** purple (`#7c3aed`) for active states, selection handles, etc.

Created via `createSystem(defaultConfig, config)` — Chakra UI v3's system API.

## Shared Types (`src/types/index.ts`)

- `ToolType` — `'select' | 'crop' | 'draw' | 'text' | 'shape'`
- `ShapeType` — `'rectangle' | 'ellipse' | 'line' | 'arrow'`
- `SidebarPanel` — union of panel IDs or `null`
- `ElementSnapshot` — serializable element state (id, type, position, size, rotation, opacity, name, locked, visible)
- `FilterConfig`, `ProjectData` — for persistence

## Entry Point (`src/main.tsx`)

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

## App Shell (`src/app/App.tsx`)

- Wraps everything in `<ChakraProvider value={system}>`
- Registers global keyboard shortcuts via `setupKeyboardShortcuts()` on mount
- Layout: horizontal `Flex` — `<Sidebar />` (left) + vertical `Flex` (`<Toolbar />`, `<CanvasHost />`, `<BottomBar />`)

## Verification

- `yarn type-check` — passes with zero errors
- `yarn dev` — Vite dev server starts on `http://localhost:5173`
- `yarn build` — production build succeeds, outputs to `dist/`
