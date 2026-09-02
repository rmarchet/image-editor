# Phase 11 — Export Formats

## Overview

Replace the two separate save buttons in the toolbar with a unified **SplitButton** that exposes
all export formats. A **Save/Export dialog** (⌘S) lets the user pick a filename and format before
exporting.

---

## Features

### SplitButton (toolbar, top-right)

| Zone | Action |
|------|--------|
| Left (Save) | Saves the project file (`.ieproj`) immediately |
| Right (chevron ▾) | Opens a dropdown with export options |

Dropdown menu items:
- **Export PNG** — raster export at 1 × artboard resolution
- **Export JPEG** — raster export, quality 0.9
- **Export SVG** — vector export (shapes & text as native SVG, images as embedded base64)
- **Export PDF** — PDF at exact artboard dimensions via jsPDF
- *(separator)*
- **Export As…** — opens the Save/Export dialog

### Save/Export Dialog (⌘S / Ctrl+S)

A modal overlay with:
- **File name** text input (default `artboard`)
- **Format** selector: Project, PNG, JPEG, SVG, PDF
- **Export** and **Cancel** buttons
- Keyboard: Enter confirms, Escape closes

---

## Technical Implementation

### New files

| File | Purpose |
|------|---------|
| `src/utils/exportSvg.ts` | SVG serialization of all element types |
| `src/utils/exportPdf.ts` | PDF export via jsPDF |
| `src/components/toolbar/SplitButton.tsx` | Split save/export button |
| `src/components/toolbar/SaveExportDialog.tsx` | Save/Export modal |

### Modified files

| File | Change |
|------|--------|
| `src/utils/export.ts` | Extracted `captureArtboardCanvas()` helper; `exportCanvas()` now accepts `filename` param |
| `src/stores/editorStore.ts` | Added `saveDialogOpen: boolean` + `setSaveDialogOpen()` |
| `src/utils/shortcuts.ts` | ⌘S / Ctrl+S now opens the Save/Export dialog instead of downloading PNG directly |
| `src/components/toolbar/Toolbar.tsx` | Replaced two `ToolButton` save entries with `<SplitButton>` + `<SaveExportDialog>` |

### Dependencies added

- `jspdf@^4` — PDF generation

---

## SVG Export Details

Each element type is serialized as follows:

| Element | SVG output |
|---------|-----------|
| `rectangle` | `<rect>` |
| `ellipse` | `<ellipse>` |
| `line` | `<line>` |
| `arrow` | `<line>` + `<polygon>` arrowhead |
| `triangle/pentagon/hexagon` | `<polygon>` (same vertex formula as PixiJS renderer) |
| `star` | `<polygon>` (5-point inner/outer radius formula) |
| `heart` | `<path>` (80-point parametric formula) |
| `text` | `<text>` with font attributes |
| `image` | `<image href="data:...">` (base64 PNG) |
| `drawing` (freehand) | `<path>` per stroke |

> **Note:** PixiJS filters (blur, brightness, etc.) are not represented in SVG output.
> For pixel-accurate export with filters applied, use PNG or JPEG.

All elements preserve: position, rotation, scale (flip), opacity, and visibility.

---

## Known Limitations

- SVG text may render differently across browsers/SVG viewers due to font availability.
- Filters are not included in SVG output.
- JPEG export is not lossless — suitable for photos, not for design assets requiring transparency.
