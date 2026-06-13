# Funnel Builder 2.0 Audit — 2026-06-12

Existing: Funnel/FunnelTemplate Prisma models, AI funnel-builder-service. Reuse Funnel model for storage. New module adds orchestration layer: landing page, thank you page, WhatsApp flow, email sequence, ad angles, launch plan, health score. Stores in user.metadata.funnel_builder. Reads from BrandContext + leadMagnetContext + webinarContext.
