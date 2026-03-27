# Phase 15 — Font Management

## Overview

Phase 15 extends the text editing experience with rich font family selection and management.
It is split into three incremental sub-phases so that a working system-font baseline can ship
first, with web-font loading and line-height controls layered on top in subsequent iterations.

---

## Scope

### Covered by Phase 15.1 (this iteration)

- Built-in catalog of cross-platform web-safe system fonts.
- Host configuration that prepends custom font-family names via `fonts.families`.
- Merged, deduplicated font list available at runtime through `getFontFamilies()`.
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
- `normalizeFonts()` merges host `families` (if provided) at the front of the list, then
  appends `SYSTEM_FONTS`, deduplicating the result.
- `getFontFamilies()` exposes the resulting list to UI consumers.
- Font-family `<select>` dropdown in the toolbar text-controls section.
- If a loaded project's `fontFamily` value is not in the current list, it is shown as an
  extra first option so the existing text renders correctly without silent fallback.

### Phase 15.2 — Web Fonts *(planned)*

**Goal:** support loading remote typefaces before use, so custom branded fonts render
consistently and export faithfully.

**Planned outcomes:**
- Extend `ImageEditorFontsConfig` with an optional `urls` or `sources` array per family.
- `FontLoader` utility that calls `document.fonts.load()` via the CSS Font Loading API.
- Fonts are loaded asynchronously at mount time; a loading state prevents text elements
  from rendering until required fonts are ready.
- SVG export embeds `@font-face` for families that have a registered URL, producing
  self-contained files.

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
| `families: ['Helvetica Neue']` | `['Helvetica Neue', ...SYSTEM_FONTS]`, deduplicated |
| `defaultFamily: 'Georgia'` | Georgia placed at front if not already present |
| Both fields | Host families first, then SYSTEM_FONTS, defaultFamily guaranteed present |

### `getFontFamilies()` getter

```ts
export function getFontFamilies(): string[] {
  return currentConfig.fonts.families;
}
```

Synchronous getter: config is set once at mount, so no memoization needed in consumers.

---

## 2. Toolbar UI (Phase 15.1 changes)

A native `<select>` element added at the start of the text-controls `<Flex>` (before Bold).

**Behaviour:**
- Shows the element's current `fontFamily` as the selected value.
- If the stored font is not in `getFontFamilies()` (legacy project), it is prepended as an
  extra option so the value remains visible and selectable.
- On change, calls `handleUpdateTextConfig({ fontFamily })`, which pushes an
  `UpdateTextConfigCommand` — giving undo/redo for free.

**No new component:** the `<select>` is an inline native element styled to match the
existing toolbar (`height: 28px`, `border-radius: 6px`, `font-size: 12px`).

---

## Technical File Summary

| File | Change |
|------|--------|
| `src/embed/config.ts` | Add `SYSTEM_FONTS`; add `showToolbarLabels` to `NormalizedImageEditorConfig`; update `normalizeFonts`; add `getFontFamilies()` |
| `src/components/toolbar/Toolbar.tsx` | Import `getFontFamilies`; add font-family `<select>` in text controls |
| `TODO.md` | Split phase 15 into 15.1 / 15.2 / 15.3 subtasks |

**No new files** for 15.1. No changes to history commands, project serialization,
or export utilities (font-family was already persisted and emitted).

---

## Verification Checklist

### Config behaviour
- [ ] Mount without `fonts` config — font picker lists all 13 `SYSTEM_FONTS`.
- [ ] Mount with `fonts.families: ['Brand Font']` — picker shows `Brand Font` first,
      then the 13 system fonts.
- [ ] Mount with `fonts.defaultFamily: 'Georgia'` — newly created text uses Georgia;
      Georgia is present in the picker.
- [ ] Mount with duplicate/invalid entries in `fonts.families` — deduplication
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
- **No font preview in the dropdown.** Option element styling is browser-restricted;
  font previews are planned for a future UI polish pass or a custom dropdown component.
- **SVG text portability.** SVG files embed the family name string only. Viewers on
  systems without the font will substitute. Embedded `@font-face` will be addressed in 15.2.
