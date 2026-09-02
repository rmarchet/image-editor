# Phase 3: Polotno-Style UI Shell

## Goal

Deliver the full editor shell around the Pixi engine: sidebar navigation, contextual panels, toolbar actions, and bottom zoom controls.

## Layout

- left: `IconBar` + optional `SidePanel`
- center/right: `Toolbar`, `CanvasHost`, `BottomBar`

All UI is implemented with Chakra primitives and tokenized colors from `src/app/theme.ts`.

## Canvas Host (`src/components/canvas/CanvasHost.tsx`)

- initializes and destroys `EditorEngine`
- resizes renderer via `ResizeObserver`
- hosts inline text editing overlay (`textarea`) when a text session is active

## Sidebar

### Navigation (`src/components/sidebar/IconBar.tsx`)

First-iteration shell exposes 8 panels:

- `upload`
- `text`
- `shapes`
- `draw`
- `layers`
- `background`
- `filters`
- `settings`

`setActivePanel` toggles open/closed behavior.

### Panel Container (`src/components/sidebar/SidePanel.tsx`)

- fixed-width panel (`250px`)
- dynamic title + component routing by panel id
- scrollable content area

## Sidebar Panels

### Upload

`src/components/sidebar/panels/UploadPanel.tsx`

- image drop/browse area
- asset library grid with thumbnails
- click asset to place centered image on artboard
- remove asset action
- project import action: `Load Project (.ieproj)`

### Text

`src/components/sidebar/panels/TextPanel.tsx`

- heading/subheading/body presets
- inserts text element in canvas center

### Shapes

`src/components/sidebar/panels/ShapesPanel.tsx`

palette includes:

- rectangle, ellipse, line, arrow
- star, heart
- triangle, pentagon, hexagon

### Draw

`src/components/sidebar/panels/DrawPanel.tsx`

- activate/deactivate draw tool
- brush size, color palette, opacity

### Layers

`src/components/sidebar/panels/LayersPanel.tsx`

- reverse-order visual stack
- select layer
- move up/down
- toggle visibility
- toggle lock
- delete

### Background

`src/components/sidebar/panels/BackgroundPanel.tsx`

- preset colors
- custom color input

### Filters

`src/components/sidebar/panels/FiltersPanel.tsx`

- preset grid (including clear option)
- applies filters to selected element(s)
- stores selected filter id metadata on element

### Settings

`src/components/sidebar/panels/SettingsPanel.tsx`

- artboard width/height numeric controls
- common canvas size presets (HD, FHD, Instagram, A4)

## Toolbar (`src/components/toolbar/Toolbar.tsx`)

Main groups:

- tool switch (`select`, `crop`)
- undo/redo
- selection actions: flip, duplicate, delete
- transform props: X, Y, W, H, rotation
- contextual style controls:
  - shape: fill, border, stroke width
  - text: bold, italic, strikethrough, size, alignment
- save actions:
  - `Save Project` (`.ieproj`)
  - `Save` image export

Toolbar actions use reusable tooltip wrapper (`src/components/Tooltip.tsx`).

## Bottom Bar (`src/components/common/BottomBar.tsx`)

- zoom out/in buttons
- zoom percentage menu trigger
- preset zoom options (`10%` to `500%`)
- `Reset` action mapped to fit-to-screen

## Responsive Behavior

- panel can collapse by re-clicking active icon
- canvas keeps flex growth (`flex: 1`, `minW: 0`)
- icon-first controls remain usable at smaller widths
