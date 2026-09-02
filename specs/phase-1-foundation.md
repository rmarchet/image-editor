# Phase 1: Project Foundation

## Goal

Replace the previous Rollup + Fabric.js stack with a modern baseline built on Vite, PixiJS v8, Chakra UI v3, and Zustand. This phase sets project structure, build tooling, and typed state architecture for the full editor rewrite.

## Migration Summary

| Concern | Legacy | Foundation Result |
|---------|--------|-------------------|
| Bundler | Rollup | Vite (`vite.config.ts`) |
| Rendering | Fabric.js | PixiJS v8 |
| UI styling | styled-components + CSS files | Chakra UI + Emotion |
| State | React Context | Zustand stores |
| TS config | ES5 / old JSX mode | ES2020 / `react-jsx` / bundler module resolution |
| Entry point | `src/index.tsx` | `src/main.tsx` |

## Build and Configuration

- `package.json` switched to ESM (`"type": "module"`)
- scripts standardized to:
  - `dev`
  - `build`
  - `preview`
  - `type-check`
- `vite.config.ts` defines React plugin, alias `@`, dev server port `5173`
- `tsconfig.json` aligned to modern Vite + TS workflow
- `index.html` moved to root (Vite convention)
- `vite-env.d.ts` added

## Core Dependencies

Runtime:

- `pixi.js`
- `@chakra-ui/react`
- `@emotion/react`
- `zustand`
- `react`, `react-dom`
- `react-icons`
- `idb-keyval`

Dev:

- `vite`
- `@vitejs/plugin-react`
- `typescript`
- `@types/react`, `@types/react-dom`, `@types/node`

Removed legacy stack:

- `fabric`, `@types/fabric`
- `styled-components`
- Rollup config/plugins

## Repository Structure

```
src/
  app/
  components/
    canvas/
    common/
    sidebar/
      panels/
    toolbar/
  engine/
    core/
    elements/
    filters/
    history/
    selection/
    tools/
  stores/
  types/
  utils/
```

## State Layer (Zustand)

The first iteration establishes domain-specific stores:

- `editorStore`: zoom, artboard, active panel, panning state
- `toolStore`: active tool + draw/shape configs
- `elementStore`: element snapshots and selection state
- `historyStore`: undo/redo stacks
- `assetStore`: upload library assets
- `textEditStore`: inline text editing session state

## Theme and App Shell

- Chakra system theme in `src/app/theme.ts`
- App shell in `src/app/App.tsx`:
  - sidebar + top toolbar + canvas host + bottom zoom bar
  - keyboard shortcuts bootstrap

## Verification Baseline

- `yarn type-check`
- `yarn dev` on `http://localhost:5173`
- `yarn build` (`tsc -b && vite build`)
