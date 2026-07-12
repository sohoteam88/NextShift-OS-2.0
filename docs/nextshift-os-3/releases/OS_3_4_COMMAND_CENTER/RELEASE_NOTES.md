# OS 3.4 Command Center Release Notes

Version: 3.4 RC

Status: RC Package Prepared - Awaiting Approval

Last Updated: 2026-07-11

---

## Summary

OS 3.4 makes the Business Brain visible in the product.

The release adds the Today's Recommendation card to the dashboard, connects a recommendation data path through runtimeized context, expands runtime adapter coverage to five modules, graduates Revenue and Analytics runtime paths to default ON, and adds Sentry-visible fallback observability for runtime adapter failures.

This package prepares OS 3.4 for approval. It does not create the `v3.4.0` tag or deploy production.

---

## User-Facing Capability

### Today's Recommendation

When Command Center is enabled, the dashboard can show a Today's Recommendation card with:

- recommendation title
- summary
- confidence
- friendly source label
- expandable rationale
- CTA route

Enablement:

```text
NEXT_PUBLIC_ENABLE_COMMAND_CENTER=true
```

When the flag is OFF, the recommendation API returns `data: null` and the dashboard card renders no DOM.

---

## Runtime Platform Changes

### Runtime Adapter Coverage

Runtime adapter coverage now includes:

- Revenue
- Analytics
- Mission Engine
- Business State
- CRM

This is 5 of 68 modules. The migration is intentionally incremental and keeps legacy fallback paths in place.

### Revenue And Analytics Default ON

Revenue and Analytics runtime adapters are graduated to default ON.

Escape hatch:

```text
retiredRevenueRuntimeFlag=false
retiredAnalyticsRuntimeFlag=false
```

Any explicit value other than exactly `true` still disables the runtime path when the escape hatch is used.

### Fallback Observability

Runtime adapter fallback warnings are now Sentry-visible.

The fallback logger:

- keeps existing `console.warn(message, payload)` behavior
- sends `Sentry.captureMessage(message, { level: 'warning', extra: payload })`
- passes through only the adapter-provided safe payload
- does not add tenant IDs, user IDs, raw payloads, headers, cookies, secrets, stack traces, or error messages

---

## Quality Summary

- Command Center E2E coverage reaches 31 tests in CI.
- Round 3 audit covers PR #23-#31 and concludes PASS.
- Round 4 audit covers PR #32-#34 and concludes PASS WITH CONDITION.
- PR #35 closes the Round 4 R-1 fallback observability condition.
- ESLint module-boundary baseline remains 192 warnings / 0 errors.
- A2 UI card follows shared UI components and token-based styling.

---

## Known Limitations

### Command Center Flag Default OFF

`NEXT_PUBLIC_ENABLE_COMMAND_CENTER` remains default OFF. The dashboard recommendation card appears only when explicitly enabled.

### Mission, Business State, And CRM Flags Default OFF

The following runtime adapters remain default OFF until a later graduation:

- Mission Engine
- Business State
- CRM

These paths retain explicit feature flag control and legacy fallback.

### D-001 Rate-Limit IP Trust

D-001 remains a deployment hardening item. The rate-limit IP trust decision still depends on the final production topology and forwarded header behavior.

### Admin Legacy Role

The legacy `admin` role is blocked by the admin root guard. This is intentional for OS 3.4 hardening, but any production users with the legacy role should be reviewed before deployment promotion.

### Migration Coverage

Runtime migration covers 5 of 68 modules. The pattern is validated, but broad adapter migration remains future work.

---

## Release Decision

```text
OS 3.4 RC prepared, awaiting approval
```
