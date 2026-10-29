-- 도배 방지(기기당 쓰기 횟수 제한) + 방명록 비밀번호 삭제.
-- shortcut: 제한 기준이 device_id라 기기 ID를 바꿔가며 보내면 우회된다. 악용이 보이면 IP 기준 제한을 추가할 것.

create extension if not exists pgcrypto with schema extensions;

create index photos_device_idx on public.photos (device_id, created_at);
create index comments_device_idx on public.comments (device_id, created_at);
create index guestbook_device_idx on public.guestbook (device_id, created_at);

-- 비밀번호 해시는 anon 읽기 컬럼 grant에 없으므로 노출되지 않는다
alter table public.guestbook add column password_hash text;

create function public._rate_limit(p_count bigint, p_max int) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if p_count >= p_max then
    raise exception 'too many requests' using errcode = 'P0001', hint = 'rate_limited';
  end if;
end $$;
revoke execute on function public._rate_limit(bigint, int) from public, anon, authenticated;

create or replace function public.add_photo(p_device_id text, p_nickname text, p_path text, p_thumb_path text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public._check_device(p_device_id);
  perform public._rate_limit(
    (select count(*) from public.photos
     where device_id = p_device_id and created_at > now() - interval '10 minutes'), 50);
  if p_path is null
     or p_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
     or p_thumb_path is distinct from regexp_replace(p_path, '\.', '_thumb.') then
    raise exception 'invalid path' using errcode = '22023';
  end if;
  if (select count(*) from storage.objects
      where bucket_id = 'photos' and name in (p_path, p_thumb_path)) <> 2 then
    raise exception 'uploaded files not found' using errcode = '22023';
  end if;

  insert into public.photos (device_id, nickname, path, thumb_path)
  values (p_device_id, public._clean(p_nickname, 10, 'nickname'), p_path, p_thumb_path)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.add_comment(p_photo_id uuid, p_device_id text, p_nickname text, p_body text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.comments;
begin
  perform public._check_device(p_device_id);
  perform public._rate_limit(
    (select count(*) from public.comments
     where device_id = p_device_id and created_at > now() - interval '1 minute'), 10);
  update public.photos set comment_count = comment_count + 1 where id = p_photo_id and not hidden;
  if not found then
    raise exception 'photo not found' using errcode = 'P0002';
  end if;
  insert into public.comments (photo_id, device_id, nickname, body)
  values (p_photo_id, p_device_id, public._clean(p_nickname, 10, 'nickname'),
          public._clean(p_body, 200, 'body'))
  returning * into v;
  return jsonb_build_object('id', v.id, 'nickname', v.nickname, 'body', v.body,
                            'created_at', v.created_at, 'mine', true);
end $$;

drop function public.add_guestbook(text, text, text);

create function public.add_guestbook(p_device_id text, p_nickname text, p_body text, p_password text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.guestbook;
begin
  perform public._check_device(p_device_id);
  perform public._rate_limit(
    (select count(*) from public.guestbook
     where device_id = p_device_id and created_at > now() - interval '10 minutes'), 3);
  if p_password is null or p_password !~ '^[0-9]{4}$' then
    raise exception 'password must be 4 digits' using errcode = '22023';
  end if;
  insert into public.guestbook (device_id, nickname, body, password_hash)
  values (p_device_id, public._clean(p_nickname, 10, 'nickname'), public._clean(p_body, 200, 'body'),
          extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning * into v;
  return jsonb_build_object('id', v.id, 'nickname', v.nickname, 'body', v.body,
                            'created_at', v.created_at);
end $$;

-- 비밀번호가 맞으면 숨김 처리. 틀렸는지 없는 글인지는 구분해서 알려주지 않는다.
create function public.delete_guestbook(p_id uuid, p_password text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.guestbook set hidden = true
  where id = p_id and not hidden and password_hash is not null
    and password_hash = extensions.crypt(coalesce(p_password, ''), password_hash);
  return found;
end $$;
