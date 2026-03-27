# Phase 15 — Font Management

## Overview

Phase 15 extends the text editing experience with rich font family selection and management.
It is split into three incremental sub-phases so that a working system-font baseline can ship
first, with web-font loading and line-height controls layered on top in subsequent iterations.

---

## Scope

### Covered by Phase 15.1 (this iteration)

- Built-in catalog of cross-platform web-safe system fonts.
- Host configuration that prepends custom font-family names via `fonts.systemFonts`.
- Merged, deduplicated font list available at runtime through `getSystemFonts()`.
- Font-family picker in the toolbar, visible only when a single text element is selected.
- Undo/redo support via the existing `UpdateTextConfigCommand`.
- Backward compatibility: existing project files with any `fontFamily` string continue to load.

### Explicitly out of scope for 15.1

- Loading of remote/web fonts (Google Fonts, CDN URLs) — deferred to 15.2.
- Embedding `@font-face` declarations in SVG export — deferred to 15.2.
- Line-height control — deferred to 15.3.

---

## Sub-phase Roadmap

### Phase 15.1 — System Fonts *(this iteration)*

**Goal:** let users pick any system font from a curated cross-platform list, and allow the
host application to extend that list with additional names.

**Key outcomes:**
- `SYSTEM_FONTS` constant exported from `config.ts` as the built-in baseline.
- `normalizeFonts()` merges host `systemFonts` (if provided) at the front of the list, then
  appends `SYSTEM_FONTS`, deduplicating the result.
- `getSystemFonts()` exposes the resulting list to UI consumers.
- Font-family `<select>` dropdown in the toolbar text-controls section.
- If a loaded project's `fontFamily` value is not in the current list, it is shown as an
  extra first option so the existing text renders correctly without silent fallback.

### Phase 15.2 — Web Fonts *(in progress)*

**Goal:** support loading remote typefaces before use, so custom branded fonts render
consistently and export faithfully.

**Implemented / in-progress outcomes:**
- Extend `ImageEditorFontsConfig` with `webFonts?: Array<{ fontFamily, name, url }>`.
- `webFontLoader.ts` utility loads configured web fonts via the CSS Font Loading API.
- Fonts are loaded asynchronously at mount time; when one or more fonts are loaded,
  existing text elements are refreshed so glyph rendering switches from fallback to target font.
- Toolbar font picker combines `webFonts` and `systemFonts` with preview rendering.
- SVG `@font-face` embedding is still deferred to a follow-up change.

### Phase 15.3 — Line-height Control *(planned)*

**Goal:** allow users to adjust the leading of text elements.

**Planned outcomes:**
- Add `lineHeight?: number` to `TextConfig` (default `1.2`).
- Wire it to Pixi `TextStyle.lineHeight`.
- Add a `TinyNumberInput` for line-height in the toolbar text row.
- Persist the value in `ProjectTextElement` and handle load-time defaults for older projects.

---

## 1. Config Layer (Phase 15.1 changes)

### `SYSTEM_FONTS` constant

Exported from `src/embed/config.ts`. A curated, ordered list of cross-platform web-safe
font names:

```
Arial, Arial Black, Comic Sans MS, Courier New, Georgia, Helvetica,
Impact, Lucida Console, Palatino Linotype, Tahoma, Times New Roman,
Trebuchet MS, Verdana
```

### `normalizeFonts()` update

| Input | Output |
|-------|--------|
| No config | `SYSTEM_FONTS`, `defaultFamily = 'Arial'` |
| `systemFonts: ['Helvetica Neue']` | `['Helvetica Neue', ...SYSTEM_FONTS]`, deduplicated |
| `defaultFamily: 'Georgia'` | Georgia placed at front if not already present |
| Both fields | Host systemFonts first, then SYSTEM_FONTS, defaultFamily guaranteed present |

### `getSystemFonts()` getter

```ts
export function getSystemFonts(): string[] {
  return currentConfig.fonts.systemFonts;
}
```

Synchronous getter: config is set once at mount, so no memoization needed in consumers.

---

## 2. Toolbar UI (Phase 15.1+15.2 changes)

A reusable custom `Select` component is used at the start of the text-controls `<Flex>`
(before Bold), so font preview is reliable across browsers.

**Behaviour:**
- Shows the element's current `fontFamily` as the selected value.
- If the stored font is not in `getSystemFonts()` (legacy project), it is prepended as an
  extra option so the value remains visible and selectable.
- On change, calls `handleUpdateTextConfig({ fontFamily })`, which pushes an
  `UpdateTextConfigCommand` — giving undo/redo for free.
- For web fonts, the picker label uses `name` while the applied style uses `fontFamily`.

`Select` options support `previewFontFamily`, allowing each option row to render with
its own font preview.

---

## Technical File Summary

| File | Change |
|------|--------|
| `src/embed/config.ts` | Add `SYSTEM_FONTS`; add `showToolbarLabels` to `NormalizedImageEditorConfig`; update `normalizeFonts`; add `getSystemFonts()` and `getWebFonts()` |
| `src/components/common/Select.tsx` | Reusable custom select with option-level preview support |
| `src/components/toolbar/Toolbar.tsx` | Combine web/system fonts into one picker with previews |
| `src/embed/webFontLoader.ts` | Load configured `webFonts` via Font Loading API |
| `src/embed/mountImageEditor.tsx` | Trigger web font loading and refresh text elements on successful load |
| `TODO.md` | Split phase 15 into 15.1 / 15.2 / 15.3 subtasks |

**No new files** for 15.1. No changes to history commands, project serialization,
or export utilities (font-family was already persisted and emitted).

---

## Verification Checklist

### Config behaviour
- [ ] Mount without `fonts` config — font picker lists all 13 `SYSTEM_FONTS`.
- [ ] Mount with `fonts.systemFonts: ['Brand Font']` — picker shows `Brand Font` first,
      then the 13 system fonts.
- [ ] Mount with `fonts.webFonts: [{ fontFamily, name, url }]` — picker shows `name`
  and renders preview using `fontFamily`.
- [ ] Mount with `fonts.defaultFamily: 'Georgia'` — newly created text uses Georgia;
      Georgia is present in the picker.
- [ ] Mount with duplicate/invalid entries in `fonts.systemFonts` — deduplication
      removes repeats, invalid entries are stripped.

### UI behaviour
- [ ] Select a text element — font-family picker appears in toolbar.
- [ ] Deselect or select a non-text element — picker disappears.
- [ ] Choose a different font from the picker — text updates immediately.
- [ ] Undo — text reverts to previous font.
- [ ] Redo — text advances to the new font again.

### Persistence
- [ ] Save project, reload — `fontFamily` is restored correctly.
- [ ] Load an old project whose `fontFamily` is not in the current list — the value
      shows as an extra option at the top of the picker; the glyph renders correctly.

### Export
- [ ] SVG export — `font-family` attribute matches the element's stored family.
- [ ] PNG export — glyphs render with the selected font.

---

## Known Limitations (15.1)

- **Font availability is not validated.** If a system font name typed by the host is not
  installed on the end-user's machine or browser, Pixi will fall back to the browser
  default (usually a generic sans-serif) silently.
- **Web font URLs require CORS compatibility.** If the remote font server blocks cross-origin
  requests, loading fails and the editor reports `WEB_FONT_LOAD_FAILED`.
- **SVG text portability.** SVG files embed the family name string only. Viewers on
  systems without the font will substitute. Embedded `@font-face` will be addressed in 15.2.
