-- Retire the old provider-specific RPC. Existing audit history/statuses are kept.
-- Gmail SMTP provides acceptance, not a reliable delivery webhook.
drop function if exists public.record_email_webhook(text,text,text,timestamptz);
