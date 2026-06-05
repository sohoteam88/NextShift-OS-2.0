# 15 — I18N Architecture

> Multi-language system for Chinese (zh), English (en), and Bahasa Melayu (ms).

---

## 1. Purpose

Ensure every user-facing string, AI output, and dynamic content renders in the user's chosen language with minimal developer friction.

## 2. Scope

- Static UI translations (labels, buttons, messages)
- AI output language control
- Database-stored content translation (funnel templates, AI prompts)
- URL / locale routing
- Language detection and switching
- RTL preparedness (future — Arabic market)

---

## 3. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Library | next-intl | First-class Next.js App Router support, server component compatible |
| Translation format | JSON (flat key-value) | Simple, diffable, AI-friendly for batch translation |
| Key convention | `module.section.key` | e.g. `crm.lead.addNote` |
| Default locale | `zh` | Primary market is Chinese-speaking Malaysian users |
| Fallback chain | User pref → `zh` | Always show something |
| AI output language | Explicit `language` param in every prompt | See `09_AI_ARCHITECTURE.md` |

---

## 4. Translation File Structure

```
src/
└── messages/
    ├── zh.json          # Chinese (Simplified)
    ├── en.json          # English
    └── ms.json          # Bahasa Melayu
```

### 4.1 Key Namespace Convention

```json
{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "confirm": "确认",
    "loading": "加载中...",
    "error": "出错了",
    "retry": "重试",
    "search": "搜索",
    "noResults": "没有结果"
  },
  "auth": {
    "login": "登录",
    "logout": "退出",
    "email": "电子邮件",
    "password": "密码"
  },
  "crm": {
    "lead": {
      "title": "潜在客户",
      "addLead": "添加潜在客户",
      "addNote": "添加备注",
      "score": "评分",
      "stage": "阶段"
    },
    "pipeline": {
      "title": "销售管道",
      "newLead": "新线索",
      "contacted": "已联系",
      "qualified": "已确认",
      "converted": "已转化",
      "lost": "已流失"
    }
  },
  "funnel": { "..." : "..." },
  "ai": { "..." : "..." },
  "member": { "..." : "..." },
  "team": { "..." : "..." },
  "admin": { "..." : "..." },
  "analytics": { "..." : "..." }
}
```

---

## 5. Locale Routing

### 5.1 App Routes (Authenticated)

Locale is **not** in the URL path for the app. It is stored in:

1. `user.preferred_language` column (DB)
2. Cookie `NEXT_LOCALE` (for SSR before auth resolves)

Middleware reads cookie → sets `next-intl` locale.

### 5.2 Public Funnel Pages

Funnel pages use path-based locale:

```
/{tenant_slug}/funnel/{funnel_slug}          → default zh
/{tenant_slug}/funnel/{funnel_slug}?lang=en  → English
/{tenant_slug}/funnel/{funnel_slug}?lang=ms  → Malay
```

---

## 6. Language Switcher Component

```tsx
// components/molecules/LanguageSwitcher.tsx

const locales = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ms', label: 'Bahasa', flag: '🇲🇾' },
];

// On change:
// 1. PATCH /api/v1/auth/me { preferred_language: newLocale }
// 2. Set cookie NEXT_LOCALE
// 3. router.refresh()
```

Placement: TopBar (right side, before avatar).

---

## 7. AI Output Language Control

Every AI generation request includes:

```json
{
  "language": "zh",           // from user.preferred_language
  "languageLabel": "Chinese"  // human-readable for prompt injection
}
```

Prompt templates append: `Respond entirely in {languageLabel}.`

See `09_AI_ARCHITECTURE.md` § Prompt Template System.

---

## 8. Database Content Translation

### 8.1 Funnel Templates

Funnel templates store content per locale:

```json
// funnel_templates.config.sections[0].content
{
  "zh": { "headline": "...", "subheadline": "..." },
  "en": { "headline": "...", "subheadline": "..." },
  "ms": { "headline": "...", "subheadline": "..." }
}
```

Rendering picks `content[currentLocale]` with fallback to `content.zh`.

### 8.2 AI Prompt Templates

`ai_prompt_templates.system_prompt` and `.user_prompt_template` are stored in the **primary authoring language** (usually zh). The AI is instructed to output in the user's language — the prompt itself does not need per-locale variants.

### 8.3 Pipeline Stage Labels

`pipeline_stages.name` stores a single string set by the operator. Operators who serve multi-language teams should use their own convention (e.g. `"新线索 / New Lead"`). A future version may add a `name_i18n` JSON column.

---

## 9. Developer Workflow

### 9.1 Adding a New String

1. Add key + Chinese value to `zh.json`
2. Add English translation to `en.json`
3. Add Malay translation to `ms.json`
4. Use `const t = useTranslations('namespace')` → `t('key')`

### 9.2 Missing Translation Handling

`next-intl` config:

```ts
{
  onError: (error) => {
    if (error.code === 'MISSING_MESSAGE') {
      console.warn(`[i18n] Missing: ${error.key} in ${error.locale}`);
    }
  },
  getMessageFallback: ({ key, namespace }) => {
    // Return the key path as visible fallback during development
    return `[${namespace}.${key}]`;
  }
}
```

Production: fallback to `zh` value silently.

### 9.3 Batch Translation Script

```bash
# scripts/translate.ts
# Reads zh.json, finds keys missing in en.json / ms.json,
# calls AI API to translate, writes back.
# Run manually; human reviews before commit.
```

---

## 10. Pluralization & Formatting

- Pluralization: Chinese has no plural forms; English uses ICU `{count, plural, one {# lead} other {# leads}}`; Malay generally no morphological plural
- Numbers: `Intl.NumberFormat(locale)` — zh uses `1,234`, en uses `1,234`, ms uses `1,234`
- Dates: `Intl.DateTimeFormat(locale)` — display relative dates with `formatRelativeTime`
- Currency: MYR (RM) for all locales

---

## 11. Risks / Tradeoffs

| Risk | Mitigation |
|------|------------|
| Translation drift (zh updated, en/ms stale) | CI script compares key counts across files; warns on mismatch |
| AI output ignores language instruction | Add language assertion at end of prompt; validate first sentence |
| Long translations break layout | Test all locales at each breakpoint; use `truncate` / `line-clamp` |
| Malay translations low quality (smaller corpus) | Human review all ms translations before release |

---

## 12. Future Expansion

- Admin UI for operators to edit translations for their tenant
- Per-tenant custom terminology (e.g. replace "Lead" with "Prospect")
- Arabic (ar) with RTL layout support
- Auto-detect browser language for unauthenticated pages

---

**Cross-references:** `09_AI_ARCHITECTURE.md` (AI language param), `11_FUNNEL_ARCHITECTURE.md` (funnel locale content), `14_UI_UX_ARCHITECTURE.md` (LanguageSwitcher component)
