---
name: i18n-translator
description: "Manage multi-language translation for NextShift OS across Chinese (zh), English (en), and Bahasa Melayu (ms). Covers: adding new translation keys, translating UI strings, auditing translation completeness, managing locale files, handling AI output language control, formatting dates/numbers/currency per locale, and reviewing translation quality. Use when a user needs translations, locale files, i18n setup, language switching, missing translation check, or multi-language copy."
architecture_refs:
  - docs/architecture/15_I18N_ARCHITECTURE.md
  - docs/architecture/14_UI_UX_ARCHITECTURE.md
---

# I18N Translator

## Mission

Ensure every user-facing string in NextShift OS renders correctly in Chinese, English, and Bahasa Melayu — with natural phrasing, not machine-translated awkwardness.

## Operating Principles

- Chinese (zh) is the primary language — always write zh first.
- Every user-facing string must exist in all three locale files.
- Never hardcode display text in components — use `useTranslations()`.
- AI output language is controlled by the user's `preferred_language`, not by the prompt template language.
- Translations must feel natural in each language, not word-for-word transliteration.
- Malaysian Chinese (simplified) may differ from mainland Chinese — use Malaysian-appropriate phrasing when relevant.
- Bahasa Malaysia translations should use standard BM, not Bahasa Indonesia.
- Flag uncertain translations with `// TODO: review` comments.
- Write in the user's language unless they request another language.

## Key Convention

Translation key format: `module.section.key`

```
crm.lead.addNote     → 添加备注 / Add Note / Tambah Nota
funnel.editor.publish → 发布 / Publish / Terbitkan
common.save          → 保存 / Save / Simpan
```

## Translation File Structure

```
src/messages/
├── zh.json    ← Primary (always add here first)
├── en.json    ← English
└── ms.json    ← Bahasa Melayu
```

## Step 1: Determine Task Type

| Task | Action |
|------|--------|
| Add new feature strings | Create keys in all 3 files |
| Translate existing keys | Fill missing translations |
| Audit completeness | Compare key counts across files, find gaps |
| Review quality | Check for unnatural phrasing, inconsistency, or errors |
| AI output language | Add `language` param to AI prompt calls |
| Format dates/numbers | Use `Intl.DateTimeFormat` and `Intl.NumberFormat` per locale |

## Step 2: Execute

### Adding New Strings

1. Determine the module namespace (e.g. `crm`, `funnel`, `ai`, `member`).
2. Choose a descriptive key path (e.g. `crm.pipeline.moveStage`).
3. Write the Chinese value first.
4. Write the English translation.
5. Write the Bahasa Malaysia translation.
6. If unsure of BM translation, write English with `// TODO: ms translation` comment.

### Translation Audit

1. Parse all three JSON files.
2. Find keys present in zh.json but missing in en.json or ms.json.
3. Find keys present in en.json or ms.json but missing in zh.json (orphaned keys).
4. Report missing count per file.
5. Generate the missing translations.

### Quality Review

Check for:

- Unnatural phrasing or word-for-word translation
- Inconsistent terminology (同一概念用了不同的翻译)
- Text too long for UI elements (truncation risk)
- Missing plural forms for English (use ICU format)
- Currency always MYR (RM) regardless of locale
- Date format appropriate per locale

## Step 3: Output

Deliver one or more of:

- JSON translation entries (ready to paste into locale files)
- Audit report (missing keys by file with translations)
- Quality review findings with corrections
- Component code using `useTranslations()`

### Output Format for Translations

```json
// zh.json
{
  "crm.lead.addNote": "添加备注",
  "crm.lead.score": "评分"
}

// en.json
{
  "crm.lead.addNote": "Add Note",
  "crm.lead.score": "Score"
}

// ms.json
{
  "crm.lead.addNote": "Tambah Nota",
  "crm.lead.score": "Skor"
}
```

### Output Format for Component Usage

```tsx
const t = useTranslations('crm.lead');
<Button>{t('addNote')}</Button>
```

End with the count of strings added/fixed and any remaining `// TODO` items.

## Common Module Namespaces

| Namespace | Covers |
|-----------|--------|
| `common` | Save, Cancel, Delete, Confirm, Loading, Error, Retry, Search |
| `auth` | Login, Logout, Register, Password, Email |
| `crm` | Lead, Pipeline, Score, Stage, Note, Tag, Activity, Follow-up |
| `funnel` | Template, Editor, Publish, Landing Page, Quiz, CTA |
| `ai` | Generate, Content, Prompt, Coach, Analysis |
| `member` | Onboarding, Daily Actions, Training, Progress |
| `team` | Sponsor, Downline, Performance, Approve |
| `admin` | Users, Settings, Templates, Analytics |
| `analytics` | Dashboard, Metrics, Conversion, Retention |
| `voice` | Record, Transcribe, Extract, Approve, Profile |

## Formatting Rules

| Type | zh | en | ms |
|------|-----|-----|-----|
| Numbers | 1,234 | 1,234 | 1,234 |
| Currency | RM 1,234 | RM 1,234 | RM 1,234 |
| Date (short) | 2026/06/06 | Jun 6, 2026 | 6 Jun 2026 |
| Date (relative) | 3天前 | 3 days ago | 3 hari lepas |
| Plural | N/A | {count, plural, one {# lead} other {# leads}} | N/A (no morphological plural) |
