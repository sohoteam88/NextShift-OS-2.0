# 11 — Funnel Architecture

## Purpose

Define the funnel system — landing pages, quizzes, lead magnets, and conversion flows.

## Scope

Funnel module. For database, see `07_DATABASE_ARCHITECTURE.md`. For AI copy, see `09_AI_ARCHITECTURE.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Page builder | JSON-config based with predefined sections | Faster than drag-and-drop, AI can generate config |
| Rendering | SSR via Next.js for public pages | SEO, fast load, social media preview |
| URL structure | `nextshift.app/f/{slug}` | No per-member DNS setup |
| Templates | Operator creates, members instantiate | Consistency within team, easy duplication |
| CTA | WhatsApp link as primary CTA | Matches Malaysian market behavior |

## Funnel Types

### 1. Landing Page
- Hero section (headline, subhead, image/video)
- Problem/solution section
- Benefits list
- Social proof / testimonials
- CTA: WhatsApp link or form

### 2. Quiz / Assessment
- Multi-step question flow (3–10 questions)
- Scored answers (health quiz, readiness assessment)
- Results page with personalized recommendation
- Lead capture: name + phone before showing results
- CTA: WhatsApp to discuss results

### 3. Lead Magnet
- Landing page with opt-in form
- Deliver digital asset (PDF guide, video, checklist)
- Lead capture: name + phone/email
- Auto-deliver via WhatsApp or email

## Funnel Config Schema

```json
{
  "type": "landing",
  "theme": {
    "primary_color": "#2563eb",
    "bg_color": "#ffffff",
    "font": "system"
  },
  "sections": [
    {
      "type": "hero",
      "headline": "...",
      "subheadline": "...",
      "image_url": "...",
      "cta_text": "...",
      "cta_type": "whatsapp",
      "cta_target": "+60123456789"
    },
    {
      "type": "benefits",
      "title": "...",
      "items": [
        { "icon": "heart", "title": "...", "description": "..." }
      ]
    },
    {
      "type": "testimonial",
      "items": [
        { "name": "...", "text": "...", "avatar_url": "..." }
      ]
    },
    {
      "type": "form",
      "fields": ["name", "phone"],
      "submit_text": "...",
      "success_message": "..."
    }
  ],
  "quiz": {
    "questions": [
      {
        "text": "...",
        "options": [
          { "text": "...", "score": 3 },
          { "text": "...", "score": 1 }
        ]
      }
    ],
    "results": [
      { "min_score": 0, "max_score": 5, "title": "...", "description": "..." },
      { "min_score": 6, "max_score": 10, "title": "...", "description": "..." }
    ]
  },
  "tracking": {
    "facebook_pixel": "",
    "google_analytics": ""
  }
}
```

## Data Flow

```
[Member creates funnel from template]
    → [AI generates copy if requested]
    → [Member customizes (phone, photo, name)]
    → [Publishes → slug assigned]
    → [Public page rendered via SSR]

[Visitor lands on funnel page]
    → [Page view tracked (analytics)]
    → [Fills quiz / form]
    → [Lead created in CRM → assigned to funnel owner]
    → [WhatsApp CTA clicked → opens WhatsApp to member]
    → [Automation triggered: welcome sequence]
```

## Main Components

```
src/modules/funnel/
├── components/
│   ├── FunnelBuilder.tsx       ← Config editor for members
│   ├── FunnelPreview.tsx       ← Live preview
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── BenefitsSection.tsx
│   │   ├── TestimonialSection.tsx
│   │   ├── FormSection.tsx
│   │   └── QuizSection.tsx
│   └── PublicFunnelPage.tsx    ← SSR rendered public page
├── services/
│   ├── funnel.service.ts       ← CRUD, publishing
│   ├── template.service.ts     ← Template management
│   └── submission.service.ts   ← Form/quiz submission → CRM
└── api/
    └── routes.ts
```

## Technical Considerations

- Public pages must load < 3s on 3G (minimize JS, optimize images)
- Meta tags for social sharing (og:title, og:image, og:description)
- Form submission creates Lead AND logs Activity in single transaction
- Phone number validation (Malaysian format: +60)
- CSRF protection on form submissions

## Future Expansion

- Drag-and-drop visual builder
- A/B testing (multiple versions, traffic split)
- Custom domain per funnel
- Video embed sections
- Multi-page funnels (thank you page, upsell page)

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Config schema becomes too complex | Keep section types minimal, add gradually |
| SEO poor for dynamic pages | SSR + proper meta tags + structured data |
| Spam form submissions | Honeypot field, rate limiting, phone validation |
