# 09 — AI Architecture

## Purpose

Define how AI is integrated — provider abstraction, prompt management, usage tracking, cost control.

## Scope

All AI-powered features. For specific AI use cases per module, see the module docs.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider abstraction | Adapter pattern with unified interface | Switch providers without changing business logic |
| Primary provider | Anthropic Claude (claude-sonnet-4-20250514) | Best for multilingual Chinese content, reasoning |
| Fallback provider | OpenAI GPT-4o | Widely available, good fallback |
| Prompt storage | Database (AIPromptTemplate table) | Operators can customize, no code deploy needed |
| Usage tracking | Per-call logging with token counts and cost | Bill tracking, quota enforcement |
| Output language | Controlled by user's `language_preference` | User sees content in their language |

## AI Provider Adapter

```typescript
// src/modules/ai/providers/types.ts
interface AIProvider {
  generateText(params: {
    systemPrompt: string
    userMessage: string
    temperature?: number
    maxTokens?: number
  }): Promise<{ text: string; tokensIn: number; tokensOut: number }>
}

// src/modules/ai/providers/anthropic.ts
class AnthropicProvider implements AIProvider { ... }

// src/modules/ai/providers/openai.ts  
class OpenAIProvider implements AIProvider { ... }

// src/modules/ai/providers/factory.ts
function getProvider(preferred?: string): AIProvider {
  // 1. Use preferred if specified
  // 2. Fall back to tenant default
  // 3. Fall back to system default
  // 4. If primary fails, auto-retry with fallback
}
```

## AI Feature Map

| Feature | Category | Input | Output | Module |
|---------|----------|-------|--------|--------|
| Content Generator | `content` | Topic, platform, tone, language | Social media post text | AI |
| Funnel Copy Generator | `funnel_copy` | Product, audience, funnel type | Headline, body, CTA | Funnel |
| WhatsApp Reply Suggest | `whatsapp_reply` | Lead context, message history | Suggested reply | CRM |
| Lead Analysis | `lead_analysis` | Lead data, activity history | Score prediction, next action | CRM |
| AI Coach | `coaching` | Member stats, recent activity | Today's priorities, tips | Member |
| Voice Profile Extraction | `voice_extract` | Transcript text | Pain points, goals, story angle, pillars | Voice |

## Prompt Template System

### Template Structure
```json
{
  "name": "Social Post Generator - Chinese",
  "category": "content",
  "language": "zh",
  "prompt": "你是一个健康顾问的社交媒体内容专家。\n\n用户信息：\n- 名字：{user_name}\n- 专长：{specialty}\n- 目标受众：{target_audience}\n\n请为以下主题创建一篇社交媒体帖子：\n主题：{topic}\n平台：{platform}\n语气：{tone}\n\n要求：\n1. 吸引注意力的开头\n2. 提供价值的内容\n3. 引导互动的结尾\n4. 适合{platform}的格式\n5. 不要提到收入或金钱承诺\n6. 教育为主，销售为辅",
  "variables": ["user_name", "specialty", "target_audience", "topic", "platform", "tone"]
}
```

### Variable Resolution
1. `{user_name}` → from User table
2. `{specialty}` → from User profile or Voice Profile extracted data
3. `{target_audience}` → from Tenant settings or user input
4. `{topic}` → user input at generation time
5. `{platform}` → user selection
6. `{tone}` → user selection or default from tenant settings

## Data Flow

```
[User clicks "Generate Content"]
    → [Frontend sends: { category, variables }]
    → [API: POST /api/v1/ai/generate/content]
    → [AI Service]:
        1. Load prompt template (by category + language)
        2. Resolve variables
        3. Build final prompt
        4. Call AI Provider (with retry/fallback)
        5. Log usage (tokens, cost)
        6. Check tenant quota
        7. Return generated text
    → [Frontend displays result]
    → [User edits and saves as Content]
```

## Cost Control

### Per-Tenant Quotas
- Defined in Tenant plan (see `06_MULTI_TENANT_ARCHITECTURE.md`)
- Checked before every AI call
- Soft limit: warning at 80%, hard limit: block at 100%
- Monthly reset

### Cost Estimation
| Model | Input $/1M tokens | Output $/1M tokens | Avg call cost |
|-------|-------------------|---------------------|--------------|
| Claude Sonnet | $3 | $15 | ~$0.02 |
| GPT-4o | $2.50 | $10 | ~$0.015 |

### Optimization Strategies
1. Cache common generations (same prompt + variables → cache 24h)
2. Use smaller models for simple tasks (classification, scoring)
3. Batch lead analysis (nightly, not real-time)
4. Stream responses for better UX (perceived faster)

## Main Components

```
src/modules/ai/
├── providers/
│   ├── types.ts          ← AIProvider interface
│   ├── anthropic.ts      ← Anthropic implementation
│   ├── openai.ts         ← OpenAI implementation
│   └── factory.ts        ← Provider selection logic
├── services/
│   ├── content.service.ts     ← Content generation
│   ├── funnel-copy.service.ts ← Funnel copy generation
│   ├── lead-analysis.service.ts ← Lead scoring/analysis
│   ├── whatsapp-reply.service.ts ← Reply suggestions
│   ├── coaching.service.ts    ← AI coaching
│   └── voice-extract.service.ts ← Voice profile extraction
├── prompt/
│   ├── resolver.ts       ← Variable resolution
│   └── validator.ts      ← Prompt safety checks
├── usage/
│   ├── tracker.ts        ← Log every call
│   └── quota.ts          ← Check/enforce limits
└── api/
    └── routes.ts         ← API endpoint handlers
```

## Technical Considerations

- All AI-generated content must be flagged (`generated_by_ai: true`) in the database
- Prompt injection defense: sanitize user inputs before inserting into prompts
- Compliance: prompts must include "no income claims" instruction for MLM context
- Streaming: use SSE for long generations to improve perceived performance
- Timeout: 30s max per AI call, fail gracefully with user-friendly message

## Future Expansion

- Fine-tuned model for industry-specific content
- RAG with operator's knowledge base (product docs, FAQ)
- Image generation for social posts
- AI-powered A/B testing of funnel copy
- Autonomous lead follow-up (AI sends WhatsApp with approval)

## Risks / Tradeoffs

| Risk | Mitigation |
|------|-----------|
| AI generates inappropriate content | Post-generation filter, compliance keywords check |
| API costs exceed revenue | Per-tenant quotas, cost monitoring alerts |
| Provider API changes | Adapter pattern isolates changes to one file |
| Prompt quality inconsistency | Operator-managed templates, default templates as starting point |
| Chinese language quality issues | Use Claude (stronger in Chinese), test prompts with native speakers |
