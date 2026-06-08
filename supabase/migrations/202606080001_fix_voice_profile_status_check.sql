alter table public.voice_profiles
  drop constraint if exists voice_profiles_status_check;

alter table public.voice_profiles
  add constraint voice_profiles_status_check
  check (
    status in (
      'uploaded',
      'transcribing',
      'transcribed',
      'extracting',
      'extracted',
      'review',
      'reviewed',
      'approved',
      'failed',
      'deleted'
    )
  );
