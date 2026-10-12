-- Accept any nonempty selection of distinct, published, fresh catalog funds.
-- Keep existing security-definer RPCs, snapshots, consent, link expiry trigger and RLS.
alter table public.comparisons drop constraint comparisons_tickers_check;
alter table public.comparisons add constraint comparisons_tickers_check
 check(cardinality(tickers)>=1 and array_ndims(tickers)=1);

create or replace function public.create_comparison(p_id uuid,p_email text,p_tickers text[],p_amount_halere bigint,p_token_hash text,p_marketing boolean,p_text_version text,p_attribution jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cid uuid; items jsonb; n integer;
begin
 if p_tickers is null or cardinality(p_tickers)<1 or array_ndims(p_tickers)<>1 or (select count(distinct t) from unnest(p_tickers) t) <> cardinality(p_tickers) then raise exception 'invalid_selection'; end if;
 select count(*),jsonb_agg(jsonb_build_object('ticker',e.ticker,'name',e.name,'exchange',e.exchange,'index',e.tracked_index,'expenseRatioPercent',e.expense_ratio_percent,'dividends',e.dividends,'description',e.description,'verifiedAt',e.verified_at,'dataAsOf',e.data_as_of,'sources',e.sources) order by array_position(p_tickers,e.ticker))
 into n,items from public.etfs e where e.ticker=any(p_tickers) and e.published and e.verified_at >= now()-interval '14 days';
 if n <> cardinality(p_tickers) then raise exception 'unavailable_etf'; end if;
 insert into public.contacts(email) values(p_email) on conflict(email) do update set email=excluded.email returning id into cid;
 insert into public.comparisons(id,contact_id,tickers,amount_halere,snapshot,token_hash,token_expires_at,attribution) values(p_id,cid,p_tickers,p_amount_halere,items,p_token_hash,now()+interval '7 days',p_attribution);
 insert into public.consent_records(contact_id,comparison_id,marketing_granted,text_version) values(cid,p_id,p_marketing,p_text_version);
 insert into public.email_messages(comparison_id) values(p_id);
 return jsonb_build_object('id',p_id);
end; $$;

create or replace function public.update_comparison(p_session_hash text,p_id uuid,p_tickers text[],p_amount_halere bigint) returns boolean
language plpgsql security definer set search_path='' as $$
declare items jsonb; n integer;
begin
 if not exists(select 1 from public.comparison_sessions where session_hash=p_session_hash and comparison_id=p_id and expires_at>now()) then return false; end if;
 if p_tickers is null or cardinality(p_tickers)<1 or array_ndims(p_tickers)<>1 or (select count(distinct t) from unnest(p_tickers) t) <> cardinality(p_tickers) then raise exception 'invalid_selection'; end if;
 select count(*),jsonb_agg(jsonb_build_object('ticker',e.ticker,'name',e.name,'exchange',e.exchange,'index',e.tracked_index,'expenseRatioPercent',e.expense_ratio_percent,'dividends',e.dividends,'description',e.description,'verifiedAt',e.verified_at,'dataAsOf',e.data_as_of,'sources',e.sources) order by array_position(p_tickers,e.ticker)) into n,items from public.etfs e where e.ticker=any(p_tickers) and e.published and e.verified_at >= now()-interval '14 days';
 if n<>cardinality(p_tickers) then raise exception 'unavailable_etf'; end if;
 update public.comparisons set tickers=p_tickers,amount_halere=p_amount_halere,snapshot=items,updated_at=now() where id=p_id;
 return true;
end; $$;

revoke all on function public.create_comparison(uuid,text,text[],bigint,text,boolean,text,jsonb),public.update_comparison(text,uuid,text[],bigint) from public,anon,authenticated;
grant execute on function public.create_comparison(uuid,text,text[],bigint,text,boolean,text,jsonb),public.update_comparison(text,uuid,text[],bigint) to service_role;
