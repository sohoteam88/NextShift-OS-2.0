# I18N Translator Examples

## Example 1: Add Strings for New CRM Feature

**Input:** "I added a 'bulk export leads' button and a confirmation dialog to the CRM. Add the translation strings."

**Expected output:**
```json
// zh.json additions
"crm.lead.bulkExport": "批量导出",
"crm.lead.bulkExportConfirm": "确认导出 {count} 条潜在客户数据？",
"crm.lead.exportSuccess": "导出成功",
"crm.lead.exportFailed": "导出失败，请重试"

// en.json additions
"crm.lead.bulkExport": "Bulk Export",
"crm.lead.bulkExportConfirm": "Export {count, plural, one {# lead} other {# leads}}?",
"crm.lead.exportSuccess": "Export successful",
"crm.lead.exportFailed": "Export failed, please retry"

// ms.json additions
"crm.lead.bulkExport": "Eksport Pukal",
"crm.lead.bulkExportConfirm": "Sahkan eksport {count} data prospek?",
"crm.lead.exportSuccess": "Eksport berjaya",
"crm.lead.exportFailed": "Eksport gagal, sila cuba lagi"
```

## Example 2: Translation Audit

**Input:** "Check if we have missing translations."

**Expected output:** "zh.json: 142 keys. en.json: 138 keys (4 missing). ms.json: 125 keys (17 missing)." + list of missing keys with generated translations.

## Example 3: Quality Review

**Input:** "Review our BM translations for the pipeline module."

**Expected output:** Findings like: `pipeline.contacted` = "Dihubungi" ✅ natural. `pipeline.qualified` = "Berkelayakan" ⚠️ awkward in CRM context, suggest "Layak" instead. etc.

## When NOT to Use This Skill

- User needs **AI to generate content in a specific language** → that's handled by `language` param in AI prompts (see `docs/architecture/09_AI_ARCHITECTURE.md`)
- User needs **funnel page copy in multiple languages** → use `growth/funnel-builder` + this skill for translations
- User needs **i18n library setup** → read `docs/architecture/15_I18N_ARCHITECTURE.md` directly
