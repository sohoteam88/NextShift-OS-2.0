# I18N Translator Checklist

Before finishing an `i18n-translator` task, check:

- [ ] Chinese (zh) value written first
- [ ] All three locale files updated (zh, en, ms)
- [ ] Key follows `module.section.key` convention
- [ ] No hardcoded strings — component uses `useTranslations()`
- [ ] Translations sound natural (not word-for-word)
- [ ] Malaysian Chinese used (not mainland-specific phrasing)
- [ ] Bahasa Malaysia used (not Bahasa Indonesia)
- [ ] English plurals use ICU format where needed
- [ ] Currency is RM regardless of locale
- [ ] Long translations checked for UI truncation risk
- [ ] Uncertain BM translations marked with `// TODO: review`
- [ ] References `docs/architecture/15_I18N_ARCHITECTURE.md`
