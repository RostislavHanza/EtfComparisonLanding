-- Temporary Preview diagnostics. No email addresses or plaintext credentials.
create table public.preview_admin_access (
 token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
 origin text not null,
 token_expires_at timestamptz not null default now()+interval '10 minutes',
 confirmed_at timestamptz,
 session_hash text unique check (session_hash ~ '^[a-f0-9]{64}$'),
 session_expires_at timestamptz
);
alter table public.preview_admin_access enable row level security;
revoke all on public.preview_admin_access from anon, authenticated;
grant all on public.preview_admin_access to service_role;
create function public.confirm_preview_admin(p_token text,p_session text,p_origin text)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 update preview_admin_access set confirmed_at=now(),session_hash=p_session,session_expires_at=now()+interval '30 minutes'
 where token_hash=p_token and origin=p_origin and confirmed_at is null and token_expires_at>now();
 return found;
end $$;
revoke all on function public.confirm_preview_admin(text,text,text) from public,anon,authenticated;
grant execute on function public.confirm_preview_admin(text,text,text) to service_role;
