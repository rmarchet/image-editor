# Phase 14 - Embeddability and External Configuration

## Overview

Phase 14 introduces the runtime boundary required to embed the image editor inside a host application.

The editor must stop behaving like a page-owned SPA and start behaving like a mountable widget with:

- a public mount API
- UI and style isolation
- a host-provided configuration object
- explicit lifecycle ownership
- host-oriented integration points for future save/load flows

This phase is intentionally split into sub-phases. The first implementation tranche focuses on the embedding shell: `mount(container, config)`, Shadow DOM mounting, single-instance lifecycle control, and the first normalized config surface.

---

## Scope Summary

Covered by Phase 14:

- embedding the editor into an arbitrary host element
- isolating UI styles from the host page with Shadow DOM
- exposing a mount API instead of hard-coding `#root`
- defining and normalizing a host configuration object
- gating editor capabilities from config instead of only from hard-coded UI lists
- preparing host-owned lifecycle and future callback handoff

Intentionally split out into later sub-phases:

- host-managed save/export callbacks
- initial project/image bootstrapping
- full custom font management UI and loading workflow
- packaging the editor as a polished reusable library artifact
- true multi-instance support in the same page

---

## Sub-phase Roadmap

### Phase 14.1 - Embedding Shell and Mount API

Goal:
- move the editor bootstrap behind a public `mount(container, config)` API
- mount the UI inside a Shadow DOM
- scope Chakra/Emotion output to the embedded root
- enforce a clean single-instance lifecycle with `destroy()`
- introduce the first normalized config contract

Key outcomes:
- the existing SPA entry becomes a thin local-demo wrapper over the same mount API
- the editor can be rendered inside another application without relying on global page layout
- style portals and environment-sensitive UI are kept inside the embedded root

### Phase 14.2 - Runtime Config Propagation

Goal:
- make the config object authoritative for the first set of host customizations

Key outcomes:
- enabled tools are hidden and ignored at runtime
- enabled shapes are filtered in the panel and validated in the drawing flow
- default text font family is host-configurable
- swatch-based color surfaces start reading from config instead of hard-coded lists
- panel visibility follows feature availability where appropriate

### Phase 14.3 - Host Initialization and Imperative API

Goal:
- let the host initialize the editor with content and interact with it after mount

Key outcomes:
- support `initialProject` and `initialImage`
- expose imperative methods such as `focus`, `loadProject`, `loadImage`, and `getProjectData`
- keep keyboard shortcuts active only while the embedded editor owns focus

### Phase 14.4 - Host-managed Save and Export

Goal:
- decouple output generation from browser download so the host can own persistence

Key outcomes:
- project serialization is available as data, not only as downloaded file
- raster/vector export flows return payloads that the host can consume
- `onSaveProject` and `onSave` replace the local download flow when configured
- toolbar actions, dialog actions, and save shortcuts route through host callbacks

### Phase 14.5 - Packaging and Integration Docs

Goal:
- expose the mount API through a reusable package/build surface and document how the host should consume it

Key outcomes:
- dedicated library-facing entry/build
- integration examples in repo docs
- explicit statement of supported and unsupported embed scenarios
- clear handoff to later phases such as fonts management and color-management overhaul

---

## 1. Embedding Shell and Mount API

The first sub-phase converts the editor from a page application into an embeddable runtime shell.

Implementation direction:

- create `mount(container, config)` as the public bootstrap entry
- create a Shadow DOM root inside the host container
- render the React app into that shadow root instead of directly into the document body
- use Chakra + Emotion with a shadow-aware environment and style insertion point
- return an imperative handle with at least:
  - `destroy()`
  - `focus()`
  - `getConfig()`
- treat the current architecture as single-instance for now and fail fast on a second mount attempt

Important constraints:

- the current engine and stores remain singleton/global internally in this tranche
- the public runtime boundary must hide those internals from the host
- mount and destroy must fully reset editor state between sessions

---

## 2. Runtime Config Contract

The config object starts small, but it must be normalized at the boundary so UI and engine code consume one consistent runtime shape.

Config surface:

- `fonts`
  - `defaultFamily`
  - `systemFonts`
- `theme`
  - `accent`
  - `accentHover`
  - `accentLight`
  - `accentDark`
  - `sidebarColor`
  - `sidebarActiveColor`
  - `sidebarBackground`
- `colorPalette`
  - `backgroundSwatches`
  - `drawSwatches`
- `enabledTools`
- `enabledShapes`
- `canvas`
  - `width`
  - `height`
  - `backgroundColor`
- `initialProject` — `ProjectFileV1 | string` (JSON object or JSON string)
- `initialImage` — `string | Blob` (URL, data URL, or Blob)
- `onSave` — Callback for image exports (PNG, JPEG, SVG, PDF)
- `onSaveProject` — Callback for project saves
- `onError` — Callback for errors and warnings
- `export`
  - `allowFormats` — Array of allowed export formats (`png`, `jpeg`, `svg`, `pdf`, `ieproj`)
  - `allowExportAs` — Whether to show the "Export As…" dialog option
  - `allowSave` — Whether to show the Save button and related UI

Rules:

- `select` is always preserved as a valid fallback tool
- shape defaults are clamped to the first enabled shape
- empty/invalid lists fall back to built-in defaults
- this contract is additive: later sub-phases can extend it without breaking 14.1 consumers

---

## 3. Host Initialization and Imperative API

This part prepares the editor to cooperate with the outer application rather than hijacking global page behavior.

### Config-based Initialization

The host can pass initial content via config:

- `initialProject` — A `ProjectFileV1` object or JSON string containing project data. The editor will deserialize and restore the full project state on mount.
- `initialImage` — A URL, data URL, or `Blob` representing a single image. The editor will clear any existing content, auto-resize the canvas to match image dimensions, and display the image.

If both are provided, `initialProject` takes precedence.

### Imperative Handle Methods

The `ImageEditorHandle` returned by `mount()` exposes:

- `destroy()` — Unmount the editor and clean up all resources
- `focus()` — Focus the editor canvas
- `getConfig()` — Return the current normalized configuration
- `loadProject(project: ProjectFileV1 | string): Promise<void>` — Clear current session and load project data
- `loadImage(source: string | Blob): Promise<void>` — Clear current session and load a single image (auto-resizes canvas)
- `getProjectData(): Promise<ProjectFileV1>` — Serialize current session to project data (no file download)

### Implementation Details

- All imperative methods wait for engine initialization before executing
- `loadProject` accepts both `ProjectFileV1` objects and JSON strings
- `loadImage` accepts URLs, data URLs, and Blob objects; Blob is converted to object URL internally
- Initial content is applied asynchronously after mount completes
- Errors during initial content loading are logged but do not block the editor

### Design Notes

- Global keyboard listeners are focus-aware
- Canvas interactions move focus into the embedded editor root
- Portalled UI such as menus and tooltips stay inside the shadow root
- Host-owned actions are exposed through the handle rather than through direct store access

---

## 4. Save/Export Callback Handoff

Save and export callbacks allow the host application to intercept save/export actions and handle persistence.

### Callback Types

```ts
interface ExportPayload {
  format: 'png' | 'jpeg' | 'svg' | 'pdf';
  data: Blob;
  filename: string;
  mimeType: string;
}

interface ProjectPayload {
  data: ProjectFileV1;
  filename: string;
}

interface EditorErrorEvent {
  type: 'error' | 'warning';
  code: string;
  message: string;
  context?: Record<string, unknown>;
}
```

### Config Options

- `onSave?: (payload: ExportPayload) => void | boolean | Promise<void | boolean>` — Called when user exports an image
- `onSaveProject?: (payload: ProjectPayload) => void | boolean | Promise<void | boolean>` — Called when user saves the project
- `onError?: (event: EditorErrorEvent) => void` — Called on errors or warnings

### Callback Return Semantics

- `void` or `true` — Host handled the action, skip default browser download
- `false` — Host processed the action AND trigger default download as well

### Error Codes

- `PROJECT_LOAD_FAILED` — Failed to load/deserialize project
- `PROJECT_SERIALIZE_FAILED` — Failed to serialize project
- `IMAGE_LOAD_FAILED` — Failed to load image
- `EXPORT_FAILED` — Failed to generate export
- `CALLBACK_ERROR` — Host callback threw an error

### Implementation Details

- Export utilities refactored to return `Blob` instead of triggering download directly
- `saveDispatcher.ts` routes all save/export actions through callbacks when configured
- `errorReporter.ts` provides `reportError()` and `reportWarning()` helpers
- Errors are always logged to console in addition to calling `onError`

---

## 5. Packaging and Integration Notes

The public mount API exists before the package-level library build is finalized.

That sequencing is intentional:

- first stabilize the runtime contract inside the repo
- then package it cleanly for external consumption

This avoids coupling packaging work to an unstable API surface.

---

## Technical File Summary

Core files for the phase:

| File | Responsibility |
|------|----------------|
| `src/index.ts` | Public runtime entry exports |
| `src/embed/mountImageEditor.tsx` | Mount API, Shadow DOM bootstrap, single-instance lifecycle, imperative handle |
| `src/embed/config.ts` | Config types, defaults, normalization, feature gating helpers |
| `src/embed/domEnvironment.ts` | Embedded DOM/focus environment helpers |
| `src/app/EditorRoot.tsx` | Chakra/Emotion/Environment wrapper for embedded rendering |
| `src/app/EditorEnvironment.tsx` | Portal host context for UI rendered inside Shadow DOM |
| `src/app/theme.ts` | Shadow-aware Chakra system factory |
| `src/main.tsx` | Local app bootstrap via the same public mount API |
| `src/stores/resetStores.ts` | Centralized runtime reset for mount/destroy |
| `src/utils/shortcuts.ts` | Focus-aware embedded keyboard handling |
| `src/utils/projectFile.ts` | Project serialization/deserialization, image loading |
| `src/utils/export.ts` | Raster export with blob generation |
| `src/utils/exportSvg.ts` | SVG export with blob generation |
| `src/utils/exportPdf.ts` | PDF export with blob generation |
| `src/embed/saveDispatcher.ts` | Unified save/export dispatch with callback routing |
| `src/embed/errorReporter.ts` | Error/warning reporting infrastructure |
| `src/engine/core/Viewport.ts` | Focus-aware pan/space keyboard handling |
| `src/engine/tools/ToolManager.ts` | Tool gating and keyboard scoping |

---

## Verification Checklist

### 14.1 - Embedding Shell
1. Mount the editor into a plain host `<div>` and confirm the UI renders correctly.
2. Confirm Chakra/Emotion styles are inserted inside the Shadow DOM instead of the document head.
3. Click inside the editor canvas and verify keyboard shortcuts become active.
4. Focus outside the editor and verify editor shortcuts no longer hijack the page.
5. Destroy the mounted editor and remount it; confirm the new session starts from clean state.

### 14.2 - Config Propagation
6. Disable `crop`, `draw`, `text`, or `shape` from config and verify the related UI/actions disappear or are ignored.
7. Disable a subset of shapes and verify the Shapes panel and shape tool respect the whitelist.
8. Pass a different default text font family and verify newly created text uses it.
9. Pass custom theme colors and verify accent colors are applied.

### 14.3 - Host Initialization
10. Mount with `initialProject` containing 2+ elements; editor opens with those elements.
11. Mount with `initialImage` (URL); editor opens with single image, canvas sized to image.
12. Mount with `initialImage` (Blob); same behavior as URL.
13. Call `handle.loadProject(...)` after mount; session resets and project loads.
14. Call `handle.loadImage(...)` after mount; session resets and image loads.
15. Call `handle.getProjectData()`; returns valid `ProjectFileV1` matching current session.
16. Provide both `initialProject` and `initialImage`; project takes precedence.

### 14.4 - Save/Export Callbacks
17. Mount without callbacks; export triggers browser download (existing behavior).
18. Mount with `onSave`; export calls callback with `ExportPayload`, no download.
19. Mount with `onSave` returning `false`; callback called AND download triggered.
20. Mount with `onSaveProject`; project save calls callback with `ProjectPayload`.
21. Invalid project load triggers `onError` with `PROJECT_LOAD_FAILED`.
22. Image load failure triggers `onError` with `IMAGE_LOAD_FAILED`.
23. All export formats (PNG, JPEG, SVG, PDF, project) work correctly with callbacks.
24. Mount with `export.allowFormats: ['png', 'jpeg']`; only PNG and JPEG appear in menus.
25. Mount with `export.allowExportAs: false`; "Export As…" option hidden from dropdown.
26. Mount with `export.allowSave: false`; Save button and related UI hidden entirely.

---

## Outcome

Phase 14 establishes the runtime boundary the editor needs in order to behave as an embeddable component instead of only as a standalone page app.

Completed sub-phases:

- **14.1** — Public mount API, Shadow DOM isolation, normalized config, controlled lifecycle
- **14.2** — Runtime config propagation for tools, shapes, theme, and color palette
- **14.3** — Host initialization with `initialProject`/`initialImage`, imperative methods for loading content and serializing projects
- **14.4** — Save/export callback handoff (`onSave`, `onSaveProject`, `onError`)

Remaining sub-phases:

- **14.5** — Packaging and integration documentation