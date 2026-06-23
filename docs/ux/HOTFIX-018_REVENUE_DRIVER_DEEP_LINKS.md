# HOTFIX-018 Revenue Driver Deep Links

Status: Implemented

Source PRD: `/Users/stevenmacmini/Desktop/HOTFIX-018_REVENUE_DRIVER_DEEP_LINKS.md/HOTFIX-018_REVENUE_DRIVER_DEEP_LINKS.md.md`

## Problem

Revenue Driver Hub actions linked users to tool pages with `?intent=...`, but the destination pages did not consume the intent.

Examples:

- `/content-engine?intent=tiktok-post`
- `/traffic-engine?intent=facebook-ad`
- `/webinar-center?intent=speaker-script`

Before this hotfix, those links could land on the correct page while still leaving the user without a clear selected tool, focused output area, or audit trace.

## Implemented Fix

Added a shared `RevenueDriverIntentResolver` that:

- Reads `intent` from the destination URL.
- Resolves it against a single typed intent registry.
- Shows a localized banner for resolved or invalid intents.
- Applies destination page state when a page supports it.
- Scrolls users to the relevant workspace or output area.
- Emits best-effort audit events through `/api/v1/revenue-drivers/intent`.

## Supported Intent Routes

Content Engine:

- `facebook-post`
- `instagram-post`
- `tiktok-post`
- `xhs-post`
- `email-content`
- `whatsapp-content`

Traffic Engine:

- `facebook-ad`
- `instagram-ad`
- `lead-generation-ad`
- `retargeting-ad`
- `campaign-strategy`
- `audience-research`

Video Production:

- `hook-generator`
- `video-script`
- `shot-list`
- `capcut-script`
- `veo-prompt`
- `minimax-prompt`
- `subtitle-generator`

Webinar Center:

- `presentation-slides`
- `speaker-script`
- `offer-stack`
- `qa-generator`
- `follow-up-sequence`
- `webinar-strategy`

WhatsApp AI:

- `connect-whatsapp`
- `train-ai`
- `test-reply`
- `follow-up-generator`
- `objection-handler`
- `closing-assistant`

Compatibility routes are also supported for existing Revenue Driver actions:

- `/lead-magnet?intent=idea`
- `/lead-magnet?intent=copy`
- `/lead-magnet?intent=opt-in-cta`
- `/funnel?intent=landing-page`
- `/funnel?intent=thank-you-page`
- `/funnel?intent=follow-up-path`

## Unknown Intent Behavior

Unknown or unsupported intent values do not produce a blank page or runtime error.

The resolver falls back to a localized invalid-intent banner and records an `intent.invalid` audit event when the user is authenticated.

## Audit Events

The audit endpoint records:

- `intent.resolved`
- `intent.invalid`
- `intent.fallback`

Metadata includes:

- Route
- Raw intent
- Resolution status
- Resolved tool id when available
- Client timestamp

## Localization

Added intent banner and tool-copy keys under `revenueDrivers.intent` in:

- `src/messages/zh.json`
- `src/messages/en.json`
- `src/messages/ms.json`

## Acceptance Criteria

- Revenue Driver Hub actions deep-link into destination tools: done.
- Content, Ads, Video, Webinar, and WhatsApp intents resolve: done.
- Invalid intent values fall back without blank/error states: done.
- Destination pages can preselect or highlight relevant state: done.
- Audit events are recorded for resolved and invalid intents when authenticated: done.
- Localized banner copy exists in zh, en, and ms: done.
- Type-check passes: verified separately.
- Targeted tests pass: verified separately.
- Authenticated visual screenshot QA: attempted separately.
