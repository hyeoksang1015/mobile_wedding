-- 하객 사진첩 + 방명록.
-- anon은 테이블에 직접 쓸 수 없고 아래 security definer RPC로만 쓴다.
-- device_id는 "본인 삭제"의 유일한 증표이므로 anon이 어떤 경로로도 읽지 못하게 한다.

-- ───────────── tables ─────────────

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  nickname text not null,
  path text not null unique,
  thumb_path text not null unique,
  like_count int not null default 0 check (like_count >= 0),
  comment_count int not null default 0 check (comment_count >= 0),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index photos_recent_idx on public.photos (created_at desc, id desc);
create index photos_popular_idx on public.photos (like_count desc, id desc);

create table public.likes (
  photo_id uuid not null references public.photos (id) on delete cascade,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (photo_id, device_id)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos (id) on delete cascade,
  device_id text not null,
  nickname text not null,
  body text not null check (char_length(body) <= 200),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
-- id는 keyset 페이지네이션의 동순위 정렬용
create index comments_photo_idx on public.comments (photo_id, created_at desc, id desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('photo', 'comment')),
  target_id uuid not null,
  device_id text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, device_id)
);

create table public.guestbook (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  nickname text not null,
  body text not null check (char_length(body) <= 200),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index guestbook_recent_idx on public.guestbook (created_at desc, id desc);

-- ───────────── RLS / privileges ─────────────

alter table public.photos enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.guestbook enable row level security;

create policy photos_read on public.photos for select to anon, authenticated using (not hidden);
create policy comments_read on public.comments for select to anon, authenticated using (not hidden);
create policy guestbook_read on public.guestbook for select to anon, authenticated using (not hidden);

-- Supabase는 public 테이블에 anon 전체 권한을 기본 부여하므로 회수하고, device_id를 뺀 컬럼만 읽게 한다.
revoke all on public.photos, public.likes, public.comments, public.reports, public.guestbook
  from anon, authenticated;
grant select (id, nickname, path, thumb_path, like_count, comment_count, created_at)
  on public.photos to anon, authenticated;
grant select (id, photo_id, nickname, body, created_at) on public.comments to anon, authenticated;
grant select (id, nickname, body, created_at) on public.guestbook to anon, authenticated;

-- ───────────── input validation helpers ─────────────

create function public._check_device(p text) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if p is null or p !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'invalid device_id' using errcode = '22023';
  end if;
end $$;

create function public._clean(p text, max_len int, label text) returns text
language plpgsql immutable set search_path = '' as $$
declare v text := btrim(coalesce(p, ''));
begin
  if char_length(v) = 0 or char_length(v) > max_len then
    raise exception '% must be 1-% characters', label, max_len using errcode = '22023';
  end if;
  return v;
end $$;

revoke execute on function public._check_device(text), public._clean(text, int, text)
  from public, anon, authenticated;

-- ───────────── photos ─────────────

create function public.add_photo(p_device_id text, p_nickname text, p_path text, p_thumb_path text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform public._check_device(p_device_id);
  if p_path is null
     or p_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|webp)$'
     or p_thumb_path is distinct from regexp_replace(p_path, '\.', '_thumb.') then
    raise exception 'invalid path' using errcode = '22023';
  end if;
  -- 실제로 업로드된 파일만 등록할 수 있다
  if (select count(*) from storage.objects
      where bucket_id = 'photos' and name in (p_path, p_thumb_path)) <> 2 then
    raise exception 'uploaded files not found' using errcode = '22023';
  end if;

  insert into public.photos (device_id, nickname, path, thumb_path)
  values (p_device_id, public._clean(p_nickname, 10, 'nickname'), p_path, p_thumb_path)
  returning id into v_id;
  return v_id;
end $$;

-- keyset 페이지네이션. 첫 페이지는 커서를 비워 보내면 최댓값 커서로 대체돼 같은 인덱스 조건을 탄다.
create function public.list_photos(
  p_device_id text,
  p_sort text default 'recent',
  p_after_created timestamptz default null,
  p_after_likes int default null,
  p_after_id uuid default null,
  p_limit int default 24
)
returns table (
  id uuid, nickname text, path text, thumb_path text, like_count int, comment_count int,
  created_at timestamptz, mine boolean, liked boolean
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 24), 1), 60);
  v_after_id uuid := coalesce(p_after_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff');
begin
  if p_sort = 'popular' then
    return query
      select p.id, p.nickname, p.path, p.thumb_path, p.like_count, p.comment_count, p.created_at,
             p.device_id = p_device_id,
             exists (select 1 from public.likes l where l.photo_id = p.id and l.device_id = p_device_id)
      from public.photos p
      where not p.hidden
        and (p.like_count, p.id) < (coalesce(p_after_likes, 2147483647), v_after_id)
      order by p.like_count desc, p.id desc
      limit v_limit;
  else
    return query
      select p.id, p.nickname, p.path, p.thumb_path, p.like_count, p.comment_count, p.created_at,
             p.device_id = p_device_id,
             exists (select 1 from public.likes l where l.photo_id = p.id and l.device_id = p_device_id)
      from public.photos p
      where not p.hidden
        and (p.created_at, p.id) < (coalesce(p_after_created, 'infinity'), v_after_id)
      order by p.created_at desc, p.id desc
      limit v_limit;
  end if;
end $$;

create function public.delete_own_photo(p_photo_id uuid, p_device_id text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  perform public._check_device(p_device_id);
  update public.photos set hidden = true
  where id = p_photo_id and device_id = p_device_id and not hidden;
  return found;
end $$;

-- 좋아요 행과 카운트를 같은 트랜잭션에서 바꾸고, 사진 행을 잠가 동시 토글을 직렬화한다.
create function public.toggle_like(p_photo_id uuid, p_device_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_liked boolean;
  v_count int;
begin
  perform public._check_device(p_device_id);
  perform 1 from public.photos where id = p_photo_id and not hidden for update;
  if not found then
    raise exception 'photo not found' using errcode = 'P0002';
  end if;

  delete from public.likes where photo_id = p_photo_id and device_id = p_device_id;
  if found then
    update public.photos set like_count = greatest(like_count - 1, 0)
    where id = p_photo_id returning like_count into v_count;
    v_liked := false;
  else
    insert into public.likes (photo_id, device_id) values (p_photo_id, p_device_id);
    update public.photos set like_count = like_count + 1
    where id = p_photo_id returning like_count into v_count;
    v_liked := true;
  end if;
  return jsonb_build_object('liked', v_liked, 'like_count', v_count);
end $$;

-- ───────────── comments ─────────────

create function public.list_comments(
  p_photo_id uuid,
  p_device_id text,
  p_after_created timestamptz default null,
  p_after_id uuid default null,
  p_limit int default 20
)
returns table (id uuid, nickname text, body text, created_at timestamptz, mine boolean)
language sql stable security definer set search_path = '' as $$
  select c.id, c.nickname, c.body, c.created_at, c.device_id = p_device_id
  from public.comments c
  where c.photo_id = p_photo_id and not c.hidden
    and (c.created_at, c.id) < (coalesce(p_after_created, 'infinity'),
                                coalesce(p_after_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'))
  order by c.created_at desc, c.id desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create function public.add_comment(p_photo_id uuid, p_device_id text, p_nickname text, p_body text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.comments;
begin
  perform public._check_device(p_device_id);
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

create function public.delete_own_comment(p_comment_id uuid, p_device_id text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_photo uuid;
begin
  perform public._check_device(p_device_id);
  update public.comments set hidden = true
  where id = p_comment_id and device_id = p_device_id and not hidden
  returning photo_id into v_photo;
  if v_photo is null then
    return false;
  end if;
  update public.photos set comment_count = greatest(comment_count - 1, 0) where id = v_photo;
  return true;
end $$;

-- ───────────── guestbook / reports ─────────────

create function public.list_guestbook(
  p_after_created timestamptz default null,
  p_after_id uuid default null,
  p_limit int default 10
)
returns table (id uuid, nickname text, body text, created_at timestamptz)
language sql stable set search_path = '' as $$
  -- invoker 권한으로 실행되므로 hidden 행은 RLS(guestbook_read)가 걸러낸다
  select g.id, g.nickname, g.body, g.created_at
  from public.guestbook g
  where (g.created_at, g.id) < (coalesce(p_after_created, 'infinity'),
                                coalesce(p_after_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'))
  order by g.created_at desc, g.id desc
  limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

create function public.add_guestbook(p_device_id text, p_nickname text, p_body text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.guestbook;
begin
  perform public._check_device(p_device_id);
  insert into public.guestbook (device_id, nickname, body)
  values (p_device_id, public._clean(p_nickname, 10, 'nickname'), public._clean(p_body, 200, 'body'))
  returning * into v;
  return jsonb_build_object('id', v.id, 'nickname', v.nickname, 'body', v.body,
                            'created_at', v.created_at);
end $$;

create function public.report(p_target_type text, p_target_id uuid, p_device_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform public._check_device(p_device_id);
  if p_target_type is null or p_target_type not in ('photo', 'comment') or p_target_id is null then
    raise exception 'invalid report target' using errcode = '22023';
  end if;
  insert into public.reports (target_type, target_id, device_id)
  values (p_target_type, p_target_id, p_device_id)
  on conflict do nothing;
end $$;

-- ───────────── storage ─────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 이름은 클라이언트가 만든 randomUUID라 남이 예측할 수 없다
create policy "photos: guest upload" on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'photos'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(_thumb)?\.(jpg|webp)$'
  );

-- add_photo 실패 시 보상 삭제용: 10분 이내에 올라왔고 아직 photos에 등록되지 않은 파일만.
-- 등록된 사진의 파일은 관리자만 지운다(게스트 삭제는 photos.hidden 처리).
create policy "photos: delete unregistered" on storage.objects for delete to anon, authenticated
  using (
    bucket_id = 'photos'
    and created_at > now() - interval '10 minutes'
    and not exists (select 1 from public.photos p where storage.objects.name in (p.path, p.thumb_path))
  );
-- Storage API의 삭제/업로드 응답은 해당 행을 다시 읽으므로 같은 범위의 select가 필요하다
create policy "photos: read unregistered" on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'photos'
    and created_at > now() - interval '10 minutes'
    and not exists (select 1 from public.photos p where storage.objects.name in (p.path, p.thumb_path))
  );
