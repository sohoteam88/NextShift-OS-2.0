# 07 — Database Architecture

## Purpose

Define every table, relationship, index, and migration strategy. This is the **source of truth** for all data models.

## Scope

PostgreSQL schema via Prisma. For domain concepts, see `03_DOMAIN_MODEL.md`.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL (via Supabase) | Mature, RLS support, JSON columns, full-text search |
| ORM | Prisma | Type-safe, migrations, introspection, seeding |
| Multi-tenancy | `tenant_id` column on every table + RLS | Simple, performant, secure |
| Soft delete | `deleted_at` timestamp (nullable) | Audit trail, recovery, compliance |
| IDs | UUID v4 (cuid2 via Prisma) | No sequential ID leaks, distributed-safe |
| Timestamps | `created_at`, `updated_at` on all tables | Audit, sorting, sync |

## Schema Overview

### Core Tables

```prisma
model Tenant {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique  // subdomain
  plan          String   @default("starter")
  settings      Json     @default("{}")
  status        String   @default("active")  // active, suspended, archived
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  users         User[]
  leads         Lead[]
  funnels       Funnel[]
  funnel_templates FunnelTemplate[]
  ai_prompts    AIPromptTemplate[]
  tags          Tag[]
  pipelines     PipelineStage[]
  whatsapp_sequences WhatsAppSequence[]
}

model User {
  id                  String   @id @default(cuid())
  tenant_id           String
  tenant              Tenant   @relation(fields: [tenant_id], references: [id])
  email               String
  name                String
  phone               String?
  role                String   @default("member")  // platform_admin, operator, leader, member
  language_preference String   @default("zh")       // zh, en, ms
  status              String   @default("pending")  // pending, active, suspended
  avatar_url          String?
  onboarding_completed Boolean @default(false)
  sponsor_id          String?
  sponsor             User?    @relation("SponsorTree", fields: [sponsor_id], references: [id])
  downline            User[]   @relation("SponsorTree")
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt
  deleted_at          DateTime?

  leads               Lead[]   @relation("LeadOwner")
  activities          Activity[]
  contents            Content[]
  funnels             Funnel[]
  daily_actions       DailyAction[]
  training_progress   TrainingProgress[]
  voice_profiles      VoiceProfile[]

  @@unique([tenant_id, email])
  @@index([tenant_id])
  @@index([sponsor_id])
}
```

### CRM Tables

```prisma
model Lead {
  id              String   @id @default(cuid())
  tenant_id       String
  tenant          Tenant   @relation(fields: [tenant_id], references: [id])
  owner_id        String
  owner           User     @relation("LeadOwner", fields: [owner_id], references: [id])
  name            String
  phone           String?
  email           String?
  source          String?    // funnel, manual, whatsapp, referral
  pipeline_stage  String     @default("new")
  score           Int        @default(0)
  notes_text      String?    // quick notes
  metadata        Json       @default("{}")  // flexible extra fields
  last_contacted  DateTime?
  next_followup   DateTime?
  created_at      DateTime   @default(now())
  updated_at      DateTime   @updatedAt
  deleted_at      DateTime?

  tags            LeadTag[]
  notes           Note[]
  activities      Activity[]

  @@index([tenant_id])
  @@index([owner_id])
  @@index([tenant_id, pipeline_stage])
  @@index([tenant_id, score])
  @@index([next_followup])
}

model Tag {
  id          String   @id @default(cuid())
  tenant_id   String
  tenant      Tenant   @relation(fields: [tenant_id], references: [id])
  name        String
  color       String   @default("#6366f1")
  created_at  DateTime @default(now())

  leads       LeadTag[]

  @@unique([tenant_id, name])
}

model LeadTag {
  lead_id String
  tag_id  String
  lead    Lead @relation(fields: [lead_id], references: [id])
  tag     Tag  @relation(fields: [tag_id], references: [id])

  @@id([lead_id, tag_id])
}

model Note {
  id          String   @id @default(cuid())
  lead_id     String
  lead        Lead     @relation(fields: [lead_id], references: [id])
  user_id     String
  content     String
  created_at  DateTime @default(now())

  @@index([lead_id])
}

model Activity {
  id          String   @id @default(cuid())
  tenant_id   String
  lead_id     String?
  lead        Lead?    @relation(fields: [lead_id], references: [id])
  user_id     String
  user        User     @relation(fields: [user_id], references: [id])
  type        String   // call, message, note, stage_change, funnel_visit, ai_generation
  description String
  metadata    Json     @default("{}")
  created_at  DateTime @default(now())

  @@index([tenant_id])
  @@index([lead_id])
  @@index([user_id])
  @@index([created_at])
}

model PipelineStage {
  id          String @id @default(cuid())
  tenant_id   String
  tenant      Tenant @relation(fields: [tenant_id], references: [id])
  name        String
  order       Int
  color       String @default("#6366f1")

  @@unique([tenant_id, name])
  @@index([tenant_id, order])
}
```

### Funnel Tables

```prisma
model FunnelTemplate {
  id          String   @id @default(cuid())
  tenant_id   String
  tenant      Tenant   @relation(fields: [tenant_id], references: [id])
  name        String
  type        String   // landing, quiz, lead_magnet
  config      Json     // template structure
  thumbnail   String?
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  funnels     Funnel[]

  @@index([tenant_id])
}

model Funnel {
  id              String   @id @default(cuid())
  tenant_id       String
  tenant          Tenant   @relation(fields: [tenant_id], references: [id])
  owner_id        String
  owner           User     @relation(fields: [owner_id], references: [id])
  template_id     String?
  template        FunnelTemplate? @relation(fields: [template_id], references: [id])
  title           String
  slug            String   @unique  // public URL slug
  config          Json     // page content, styling
  status          String   @default("draft")  // draft, published, archived
  published_at    DateTime?
  views           Int      @default(0)
  conversions     Int      @default(0)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([tenant_id])
  @@index([slug])
}
```

### AI Tables

```prisma
model AIPromptTemplate {
  id          String   @id @default(cuid())
  tenant_id   String
  tenant      Tenant   @relation(fields: [tenant_id], references: [id])
  name        String
  category    String   // content, funnel_copy, lead_analysis, whatsapp_reply, coaching
  prompt      String   // the system prompt template
  variables   Json     @default("[]")  // expected variables like {lead_name}, {product}
  language    String   @default("zh")
  is_default  Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([tenant_id, category])
}

model AIUsageLog {
  id          String   @id @default(cuid())
  tenant_id   String
  user_id     String
  provider    String   // openai, anthropic
  model       String   // gpt-4o, claude-sonnet-4-20250514
  category    String
  tokens_in   Int
  tokens_out  Int
  cost_usd    Float
  created_at  DateTime @default(now())

  @@index([tenant_id, created_at])
  @@index([tenant_id, user_id])
}
```

### Automation Tables

```prisma
model WhatsAppSequence {
  id          String   @id @default(cuid())
  tenant_id   String
  tenant      Tenant   @relation(fields: [tenant_id], references: [id])
  name        String
  trigger     String   // new_lead, stage_change, manual
  steps       Json     // array of { delay_hours, message_template, condition }
  status      String   @default("active")
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([tenant_id])
}

model ScheduledMessage {
  id            String   @id @default(cuid())
  tenant_id     String
  lead_id       String
  user_id       String
  channel       String   @default("whatsapp")
  message       String
  scheduled_at  DateTime
  sent_at       DateTime?
  status        String   @default("pending")  // pending, sent, failed, cancelled
  created_at    DateTime @default(now())

  @@index([status, scheduled_at])
  @@index([tenant_id])
}
```

### Member & Team Tables

```prisma
model DailyAction {
  id          String   @id @default(cuid())
  tenant_id   String
  user_id     String
  user        User     @relation(fields: [user_id], references: [id])
  date        DateTime @db.Date
  type        String   // post_content, follow_up, training, funnel_share
  description String
  completed   Boolean  @default(false)
  completed_at DateTime?
  created_at  DateTime @default(now())

  @@index([user_id, date])
  @@index([tenant_id, date])
}

model TrainingProgress {
  id          String   @id @default(cuid())
  tenant_id   String
  user_id     String
  user        User     @relation(fields: [user_id], references: [id])
  module_id   String
  module_name String
  status      String   @default("not_started")  // not_started, in_progress, completed
  completed_at DateTime?
  created_at  DateTime @default(now())

  @@unique([user_id, module_id])
  @@index([tenant_id])
}

model Content {
  id              String   @id @default(cuid())
  tenant_id       String
  owner_id        String
  owner           User     @relation(fields: [owner_id], references: [id])
  type            String   // social_post, story, whatsapp_reply, funnel_copy
  platform        String?  // facebook, instagram, whatsapp
  body            String
  language        String   @default("zh")
  generated_by_ai Boolean  @default(false)
  prompt_used     String?
  created_at      DateTime @default(now())
  updated_at      DateTime @default(now()) @updatedAt

  @@index([tenant_id])
  @@index([owner_id])
  @@index([tenant_id, owner_id, updated_at, id])
  @@index([tenant_id, updated_at, id])
}
```

### Voice Capture Tables

```prisma
model VoiceProfile {
  id              String   @id @default(cuid())
  tenant_id       String
  user_id         String
  user            User     @relation(fields: [user_id], references: [id])
  audio_url       String
  transcript      String?
  extracted_data  Json?    // { pain_points, goals, story_angle, content_pillars }
  status          String   @default("uploaded")  // uploaded, transcribed, extracted, reviewed
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  @@index([tenant_id])
  @@index([user_id])
}
```

## Data Flow

```
[Prisma Client] → [PostgreSQL]
    ↑
    │ All queries go through Prisma middleware that:
    │   1. Injects tenant_id filter
    │   2. Filters out soft-deleted records
    │   3. Logs slow queries
    │
[API Route / Service Layer]
```

## Technical Considerations

- **Migrations**: Prisma Migrate for schema changes. Every migration must be reviewed.
- **Seeding**: Seed script for demo tenant, sample leads, default pipeline stages.
- **Indexes**: Added on all `tenant_id`, foreign keys, and common query patterns.
- **JSON columns**: Used for flexible/configurable data (funnel config, settings, metadata). Do NOT store queryable business data in JSON.
- **Backups**: Daily automated pg_dump to external storage.

## Future Expansion

- Partitioning the Activity table by `created_at` when it grows large
- Read replicas for analytics queries
- Full-text search index on Lead name/notes
- Audit log table for compliance

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| Schema drift from architecture doc | Prisma schema IS the source of truth; this doc must be updated with it |
| JSON columns become unstructured mess | Document expected JSON shapes here; validate in service layer |
| Missing indexes cause slow queries | Monitor query performance, add indexes proactively |
| Migration breaks production | Test migrations on staging first, always use `prisma migrate deploy` |
