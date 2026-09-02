# Phase 7: Project Files and Asset Workflow

## Goal

Introduce a portable, versioned project format (`.ieproj`) and connect it to the Upload asset library so a project can be saved, reopened, and immediately reused in the UI.

This phase extends Phase 6 persistence with explicit file-based import/export, richer element serialization, and asset library synchronization.

## What This Adds Beyond Phase 6

- A project file format with versioning (`ProjectFileV1`)
- Full element serialization/deserialization (`image`, `text`, `shape`, `drawing`)
- Preservation of transform details not present in snapshots (`scaleX`, `scaleY`)
- Preservation of visual effects (`filterId`)
- Toolbar action to save the current project as `.ieproj`
- Upload panel action to load `.ieproj`
- Automatic Upload asset repopulation from images inside loaded projects

## File Format: `.ieproj`

### Types (`src/types/index.ts`)

Project file contracts are defined with dedicated interfaces:

- `ProjectElementBase`
- `ProjectImageElement`
- `ProjectTextElement`
- `ProjectShapeElement`
- `ProjectDrawingElement`
- `ProjectElement` union
- `ProjectFileV1`

These contracts include:

- Common transform/state data: `x`, `y`, `width`, `height`, `rotation`, `opacity`, `locked`, `visible`, `scaleX`, `scaleY`
- Visual filter state: `filterId`
- Type-specific payload:
  - image: `source`
  - text: content and typography (including `strikethrough`)
  - shape: `shapeType`, fill/stroke
  - drawing: serialized stroke list

## Serialization and Deserialization

### `src/utils/projectFile.ts`

Main responsibilities:

- `saveProjectToFile()`:
  - reads current engine/editor state
  - serializes all elements to `ProjectElement[]`
  - writes `ProjectFileV1` JSON
  - triggers browser download as `*.ieproj`

- `loadProjectFromFile(file)`:
  - validates JSON structure and version
  - clears current scene
  - restores canvas size/background
  - recreates and rehydrates each element
  - restores scale and filter metadata
  - returns `ProjectImageElement[]` for Upload synchronization

### Image Source Normalization

For reliability across sessions, image sources are normalized to data URLs where possible:

- `normalizeSourceToDataUrl(source)`
- fallback strategy keeps original source when conversion is not possible

## Upload Asset Library Integration

### `src/components/sidebar/panels/UploadPanel.tsx`

The Upload panel now supports two loading paths:

- image files (existing flow)
- `.ieproj` files (new flow)

When a project is loaded:

1. `loadProjectFromFile()` returns project image elements
2. images are deduplicated by `source`
3. assets are built (thumbnail generation + metadata fallback)
4. asset library is replaced via `setAssets()`

Result: Upload shows images contained in the loaded project, not only newly uploaded files.

## Asset Store Lifecycle

### `src/stores/assetStore.ts`

Asset state now includes bulk replacement:

- `setAssets(assets)`

Memory safety is improved with explicit object URL cleanup:

- `revokeIfObjectUrl(url)` only revokes `blob:` URLs
- cleanup runs on `removeAsset` and `setAssets`

## UI Entry Points

### Toolbar Save Project

`src/components/toolbar/Toolbar.tsx` adds a dedicated action:

- `Save Project` button -> `saveProjectToFile()`

### Upload Load Project

`src/components/sidebar/panels/UploadPanel.tsx` adds:

- `Load Project (.ieproj)` button
- drag-and-drop detection for `.ieproj`

## Design Notes

- Versioned format (`version: 1`) allows future migrations.
- Load operation restores engine scene first, then synchronizes UI/store.
- Upload library synchronization is intentionally data-driven via return value from loader, avoiding duplicate parsing in UI.
