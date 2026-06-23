# UX-002 Revenue Driver Discovery Sprint V2 PRD

Status: Implemented

Source PRD: `/Users/stevenmacmini/Desktop/UX-002_REVENUE_DRIVER_DISCOVERY_SPRINT_V2_PRD.md/UX-002_REVENUE_DRIVER_DISCOVERY_SPRINT_V2_PRD.md.md`

## Mission

Make the highest-revenue capabilities impossible to miss.

The implementation treats Revenue Drivers as a discoverability layer over existing revenue tools, not a replacement for the underlying WhatsApp, content, video, traffic, webinar, lead magnet, or funnel modules.

## Revenue Driver Hierarchy

1. WhatsApp AI Auto Reply
2. Content Generator
3. Video Generator
4. Ads Generator
5. Webinar Generator
6. Lead Magnet Generator
7. Funnel Generator

## Implemented Surfaces

- New `/revenue-drivers` authenticated Hub route.
- Dashboard Revenue Driver section inserted after AI COO and before Journey/Momentum.
- Sidebar Revenue Drivers section is always visible for member, leader, operator, and platform admin experiences.
- Mobile tab bar includes a Revenue entry.
- Mission Workspace shows context-aware Revenue Driver Actions for relevant mission types.
- AI COO Dashboard execution routes revenue-adjacent missions through `/revenue-drivers?driver=...`.

## Hub Contract

The Hub uses `src/modules/revenue-drivers/constants/revenue-drivers.ts` as the single driver registry.

Each driver defines:

- Priority order
- Hub focus route
- Underlying product route
- Primary launch action
- Secondary generator actions
- Translation keys

## AI COO Routing

Mission routing maps to Revenue Drivers without changing the core MissionType state machine:

- `CONTENT` -> Content Generator
- `LEAD_MAGNET` -> Lead Magnet Generator
- `FUNNEL` -> Funnel Generator
- `TRAFFIC` -> Ads Generator
- `CUSTOMERS` and `RETENTION` -> WhatsApp AI
- `OPTIMIZATION` -> Video Generator

This preserves existing mission verification logic while satisfying the Revenue Driver discovery requirement.

## Webinar Generators

The Webinar driver exposes:

- Webinar Strategy
- Presentation Slides
- Speaker Script
- Offer Stack
- CTA Slides
- Q&A Handling
- WhatsApp Follow-Up
- Email Follow-Up
- Replay Sequence
- Closing Reminder

## Localization

Added `revenueDrivers` and navigation strings to:

- `src/messages/zh.json`
- `src/messages/en.json`
- `src/messages/ms.json`

## Acceptance Criteria

- Revenue Driver Hub exists: done.
- WhatsApp AI visible: done.
- Content visible: done.
- Video visible: done.
- Ads visible: done.
- Webinar visible: done.
- Webinar Presentation Generator exists: done via `presentation-slides` action.
- Webinar Speaker Script Generator exists: done via `speaker-script` action.
- AI COO routes to Revenue Drivers: done via Dashboard execution route mapping.
- Mission Workspace exposes Revenue Drivers: done.
- Sidebar Revenue Driver section exists: done.
- Localization supported: done.
- Type-check passes: verified separately.
- Build passes: verified separately.
