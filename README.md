# Image Editor

Web image editor built with React + TypeScript + PixiJS v8.

The project started as a full rewrite from a Fabric.js/Rollup architecture to a Vite/Pixi/Zustand stack with a design-tool style UI.

## Highlights

- PixiJS rendering engine with zoom/pan viewport
- Sidebar-driven editor shell (upload, text, shapes, draw, layers, background, filters, settings)
- Tool system (`select`, `crop`, `draw`, `text`, `shape`)
- Command-based undo/redo
- Layer management (select, reorder, visibility, lock, delete)
- Image/text/shape/drawing elements
- Inline text editing overlay
- Filter presets and filter persistence metadata
- Project save/load as `.ieproj`
- Export to image (`png`/`jpeg`)

## Tech Stack

- React 19
- TypeScript 5
- PixiJS 8
- Chakra UI 3 + Emotion
- Zustand 5
- Vite 7

## Project Specs

Implementation notes are documented in `specs/`:

- `specs/phase-1-foundation.md`
- `specs/phase-2-engine.md`
- `specs/phase-3-ui.md`
- `specs/phase-4-tools.md`
- `specs/phase-5-advanced.md`
- `specs/phase-6-polish.md`
- `specs/phase-7-project-files-and-assets.md`
- `specs/phase-8-editing-extensions.md`
- `specs/phase-9-zoom-controls-and-centered-viewport.md`
- `specs/phase-10-toolbar-filters-and-transform-consistency.md`

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Install

```bash
git clone https://github.com/rmarchet/image-editor.git
cd image-editor
yarn install
```

### Run Dev Server

```bash
yarn dev
```

Default URL: `http://localhost:5173`

## Scripts

- `yarn dev` - start Vite dev server
- `yarn build` - type-check + production build
- `yarn preview` - preview production build
- `yarn type-check` - run TypeScript checks

## Architecture Overview

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

## License

MIT

## Author

Roberto Marchetti

