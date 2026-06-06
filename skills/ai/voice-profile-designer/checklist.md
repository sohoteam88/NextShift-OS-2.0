# Voice Profile Designer Checklist

Before finishing a `voice-profile-designer` task, check:

- [ ] Referenced `docs/architecture/16_VOICE_CAPTURE_ARCHITECTURE.md`
- [ ] Recording max duration set (≤ 5 minutes)
- [ ] File size limit enforced (≤ 10 MB)
- [ ] All 6 states handled (idle, recording, uploading, processing, review, approved)
- [ ] AI extraction prompt includes "do not invent data" guardrail
- [ ] AI extraction prompt includes "Respond in JSON only"
- [ ] Mixed language handling specified (zh + en code-switching)
- [ ] Review step is mandatory before data is saved
- [ ] User can edit every extracted field
- [ ] Audio files are tenant-isolated in storage
- [ ] User can delete their audio recording
- [ ] Cost estimate included (Whisper + AI + storage)
- [ ] Rate limit specified (max 3 recordings/user/day)
- [ ] Profile sync targets specified (which DB fields are updated)
