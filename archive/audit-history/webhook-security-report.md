# Webhook Security Report

Date: 2026-06-19
Phase: E2A Security Blocker Remediation
Status: Remediated

## Scope

Reviewed and remediated Billplz webhook verification at:

- `src/app/api/payments/billplz/webhook/route.ts`

## Previous Risk

The webhook signature verifier returned `true`, allowing forged payment webhooks to reach `paymentService.handleWebhook`.

## Remediation

- Implemented HMAC-SHA256 verification using server-only `BILLPLZ_X_SIGNATURE_KEY`.
- Verification now uses the raw request body from `req.text()`.
- Signature comparison uses `timingSafeEqual`.
- Missing or invalid signatures return `401`.
- Optional timestamp header `x-billplz-timestamp` is rejected when stale or malformed.

## Verification

Regression coverage added:

- valid signature accepted
- invalid signature rejected
- missing signature rejected
- stale timestamp rejected when timestamp is supplied

Command:

```bash
pnpm vitest run src/__tests__/security/*.test.ts
```

Result: 7 files passed, 32 tests passed.

## Decision

Billplz webhook blocker is remediated.
