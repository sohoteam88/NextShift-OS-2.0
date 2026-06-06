# Accessibility Auditor Examples

## Example 1: Form Accessibility Check

**Input:** "Audit the lead creation form for accessibility issues."

**Expected output:**

Findings:
1. ❌ Input labels are placeholder-only — disappear on focus. Fix: add visible `<label>` above each input.
2. ❌ Error messages not linked to inputs. Fix: add `aria-describedby` pointing to error `<span>`.
3. ⚠️ Submit button has no loading state for screen readers. Fix: add `aria-busy="true"` and `aria-label="正在保存..."` during submission.
4. ✅ Form is keyboard-navigable (Tab order correct).
5. ⚠️ Color contrast on placeholder text: 3.2:1 (needs 4.5:1). Fix: darken placeholder to #6b7280.

## When NOT to Use This Skill

- User needs **UI component design** → use `core/design-system-architect`
- User needs **mobile layout** → use `ux/mobile-first-designer`
