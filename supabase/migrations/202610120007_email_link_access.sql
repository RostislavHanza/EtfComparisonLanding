-- Existing one-time redemption remains unchanged. A consumed link can only reopen
-- the same confirmed comparison with its existing valid HttpOnly session.
create function public.reopen_comparison(p_token_hash text,p_session_hash text) returns uuid
language sql security definer set search_path='' as $$
 select c.id from public.comparisons c
 join public.comparison_sessions s on s.comparison_id=c.id
 where c.token_hash=p_token_hash and c.confirmed_at is not null
 and c.token_expires_at>now() and s.session_hash=p_session_hash and s.expires_at>now();
$$;
revoke all on function public.reopen_comparison(text,text) from public,anon,authenticated;
grant execute on function public.reopen_comparison(text,text) to service_role;
