# CRM Database Checklist

- [ ] All tables have tenant_id column
- [ ] RLS enabled on tenant-scoped tables
- [ ] Indexes on frequently filtered columns
- [ ] Lifecycle states use explicit enums (not booleans)
- [ ] created_at and updated_at on all tables
- [ ] Relationships use foreign keys
- [ ] Prisma model matches SQL schema
- [ ] Migration-ready (no breaking changes without migration plan)
- [ ] Architecture doc `07_DATABASE_ARCHITECTURE.md` flagged for update
