# V6-8B — Admin Settings Decomposition Report

**Date:** 2026-06-14
**Scope:** Refactor AdminSettingsPanel.tsx into thin orchestrator
**Status:** ✅ Complete

---

## Before & After

| File | Before | After |
|---|---|---|
| `AdminSettingsPanel.tsx` | **349 lines** (monolith) | **71 lines** (orchestrator) |
| `settings/GeneralSettings.tsx` | — | 59 lines |
| `settings/AIRouterConfig.tsx` | — | 49 lines |
| `settings/VoiceUploadSettings.tsx` | — | 27 lines |
| `settings/LinkSettings.tsx` | — | 29 lines |
| **Total** | **349** | **235** (5 files) |

---

## State Ownership

```
AdminSettingsPanel (orchestrator — 71 lines)
  ├── useState: form, tenantId, uploading
  ├── useQuery: fetch settings from API
  ├── useMutation: save settings
  ├── handleLogoUpload: upload handler
  │
  ├── GeneralSettings     ← props: form, setForm, tenant, stats, uploading, onLogoUpload
  ├── AIRouterConfig      ← props: mode, provider, autoEscalate, on*Change callbacks
  ├── VoiceUploadSettings  ← props: unlimited, limitPerDay, on*Change callbacks
  └── LinkSettings        ← props: sections[] (CRM + Automation links)
```

All state, queries, and mutations stay in the orchestrator. Extracted components are pure presentational — they receive data and fire callbacks.

---

## Components Created

| Component | Props | Responsibility |
|---|---|---|
| `GeneralSettings` | `form, setForm, tenant, stats, uploading, onLogoUpload` | Team name, logo, language, plan info |
| `AIRouterConfig` | `mode, provider, autoEscalate, on*Change` | AI model routing config |
| `VoiceUploadSettings` | `unlimited, limitPerDay, on*Change` | Voice upload daily limits |
| `LinkSettings` | `sections[]` (reusable link list) | CRM + Automation navigation links |

---

## Verification

```
$ pnpm type-check
✓ tsc --noEmit — 0 errors

$ pnpm build
✓ Compiled successfully
✓ Generating static pages (208/208)
```

---

## Cumulative Admin UI Decomposition

| Phase | Component | Before | After |
|---|---|---|---|
| V6-8A | `AdminCommandCenter.tsx` | 355 | 11 (barrel) |
| V6-8B | `AdminSettingsPanel.tsx` | 349 | 71 (orchestrator) |
| — | 13 new focused files | 0 | 484 |
| **Total** | | **704** | **566 (−20%)** |

### Remaining Admin UI Debt

| File | Lines | Priority |
|---|---|---|
| `PlatformOperatingDashboard.tsx` | 287 | 🟡 Medium |
| `TemplatesPanel.tsx` | 237 | 🟢 Low |
