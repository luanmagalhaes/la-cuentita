create table if not exists lc_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  phase text not null default 'LOBBY' check (phase in ('LOBBY', 'PLAYING', 'FINISHED')),
  round_number smallint not null default 1 check (round_number >= 1),
  starting_savings integer,
  is_test boolean not null default false,
  host_player_id uuid,
  created_at timestamp with time zone not null default now(),
  started_at timestamp with time zone,
  finished_at timestamp with time zone
);

create table if not exists lc_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references lc_rooms (id) on delete cascade,
  name text not null,
  avatar text,
  emoji text,
  seat smallint not null,
  created_at timestamp with time zone not null default now()
);

create table if not exists lc_player_secrets (
  room_id uuid not null references lc_rooms (id) on delete cascade,
  player_id uuid not null references lc_players (id) on delete cascade,
  access_token text not null unique,
  primary key (room_id, player_id)
);

create table if not exists lc_bills (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references lc_rooms (id) on delete cascade,
  round_number smallint not null check (round_number >= 1),
  payer_id uuid references lc_players (id) on delete set null,
  created_by uuid references lc_players (id) on delete set null,
  total integer not null check (total >= 0),
  split_mode text not null check (split_mode in ('SOLO', 'HALF', 'DUTCH')),
  detail jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (room_id, round_number)
);

create table if not exists lc_bill_shares (
  bill_id uuid not null references lc_bills (id) on delete cascade,
  player_id uuid not null references lc_players (id) on delete cascade,
  amount integer not null check (amount >= 0),
  primary key (bill_id, player_id)
);

create table if not exists lc_matches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid,
  room_code text not null,
  winner_names text[] not null default '{}',
  players jsonb not null,
  bars smallint not null,
  starting_savings integer not null,
  finished_at timestamp with time zone not null default now()
);

create index if not exists lc_players_room_idx on lc_players (room_id, seat);
create index if not exists lc_bills_room_idx on lc_bills (room_id, round_number);
create index if not exists lc_bill_shares_player_idx on lc_bill_shares (player_id);
create index if not exists lc_matches_room_idx on lc_matches (room_id);
create index if not exists lc_matches_finished_idx on lc_matches (finished_at desc);

alter table lc_rooms enable row level security;
alter table lc_players enable row level security;
alter table lc_player_secrets enable row level security;
alter table lc_bills enable row level security;
alter table lc_bill_shares enable row level security;
alter table lc_matches enable row level security;

create or replace function lc_generate_code() returns text
language plpgsql
as $$
declare
  candidate text;
begin
  delete from lc_rooms where created_at < now() - interval '24 hours';

  select code_number::text
    into candidate
    from generate_series(10, 99) as code_number
   where code_number::text not in (select code from lc_rooms)
   order by random()
   limit 1;

  if candidate is null then
    raise exception 'LC_NO_CODES';
  end if;

  return candidate;
end;
$$;

create or replace function lc_settle(p_room_id uuid) returns void
language plpgsql
as $$
declare
  room_row lc_rooms%rowtype;
  anyone_broke boolean;
  best integer;
  winners text[];
  ranking jsonb;
  bar_count integer;
begin
  select * into room_row from lc_rooms where id = p_room_id;

  if not found or room_row.phase <> 'PLAYING' or room_row.starting_savings is null then
    return;
  end if;

  with standing as (
    select player.name,
           player.seat,
           room_row.starting_savings - coalesce(sum(share.amount), 0) as savings
      from lc_players player
      left join lc_bill_shares share on share.player_id = player.id
     where player.room_id = p_room_id
     group by player.id, player.name, player.seat
  )
  select bool_or(savings <= 0),
         max(savings),
         jsonb_agg(jsonb_build_object('name', name, 'savings', savings) order by savings desc, seat),
         array_agg(name order by seat) filter (where savings = (select max(inner_standing.savings) from standing inner_standing))
    into anyone_broke, best, ranking, winners
    from standing;

  if not coalesce(anyone_broke, false) then
    return;
  end if;

  select count(*) into bar_count from lc_bills where room_id = p_room_id;

  update lc_rooms set phase = 'FINISHED', finished_at = now() where id = p_room_id;

  if not room_row.is_test then
    insert into lc_matches (room_id, room_code, winner_names, players, bars, starting_savings)
    values (p_room_id, room_row.code, coalesce(winners, '{}'), coalesce(ranking, '[]'::jsonb), bar_count, room_row.starting_savings);
  end if;
end;
$$;

create or replace function lc_record_bill(
  p_room_id uuid,
  p_round integer,
  p_payer uuid,
  p_created_by uuid,
  p_total integer,
  p_split_mode text,
  p_detail jsonb,
  p_shares jsonb,
  p_replace_bill uuid default null
) returns jsonb
language plpgsql
as $$
declare
  room_row lc_rooms%rowtype;
  latest lc_bills%rowtype;
  new_bill uuid;
  shares_total integer;
begin
  select * into room_row from lc_rooms where id = p_room_id for update;

  if not found then
    raise exception 'LC_ROOM_GONE';
  end if;

  if room_row.phase = 'LOBBY' then
    raise exception 'LC_NOT_PLAYING';
  end if;

  if p_replace_bill is null then
    if room_row.phase <> 'PLAYING' then
      raise exception 'LC_NOT_PLAYING';
    end if;

    if p_round <> room_row.round_number then
      raise exception 'LC_WRONG_ROUND';
    end if;
  else
    select * into latest from lc_bills where room_id = p_room_id order by round_number desc limit 1;

    if not found or latest.id <> p_replace_bill then
      raise exception 'LC_NOT_LATEST';
    end if;

    if p_round <> latest.round_number then
      raise exception 'LC_WRONG_ROUND';
    end if;

    delete from lc_bills where id = p_replace_bill;
    delete from lc_matches where room_id = p_room_id;
    update lc_rooms
       set phase = 'PLAYING', finished_at = null, round_number = p_round
     where id = p_room_id;
  end if;

  insert into lc_bills (room_id, round_number, payer_id, created_by, total, split_mode, detail)
  values (p_room_id, p_round, p_payer, p_created_by, p_total, p_split_mode, p_detail)
  returning id into new_bill;

  insert into lc_bill_shares (bill_id, player_id, amount)
  select new_bill, (share ->> 'player_id')::uuid, (share ->> 'amount')::integer
    from jsonb_array_elements(p_shares) as share;

  select coalesce(sum(amount), 0) into shares_total from lc_bill_shares where bill_id = new_bill;

  if shares_total <> p_total then
    raise exception 'LC_SHARES_MISMATCH';
  end if;

  update lc_rooms set round_number = p_round + 1 where id = p_room_id;

  perform lc_settle(p_room_id);

  return jsonb_build_object(
    'bill_id', new_bill,
    'phase', (select phase from lc_rooms where id = p_room_id)
  );
end;
$$;

create or replace function lc_undo_bill(p_room_id uuid, p_bill_id uuid) returns jsonb
language plpgsql
as $$
declare
  room_row lc_rooms%rowtype;
  latest lc_bills%rowtype;
begin
  select * into room_row from lc_rooms where id = p_room_id for update;

  if not found then
    raise exception 'LC_ROOM_GONE';
  end if;

  select * into latest from lc_bills where room_id = p_room_id order by round_number desc limit 1;

  if not found or latest.id <> p_bill_id then
    raise exception 'LC_NOT_LATEST';
  end if;

  delete from lc_bills where id = p_bill_id;
  delete from lc_matches where room_id = p_room_id;

  update lc_rooms
     set round_number = latest.round_number, phase = 'PLAYING', finished_at = null
   where id = p_room_id;

  return jsonb_build_object('round', latest.round_number);
end;
$$;

revoke execute on function lc_generate_code() from public, anon, authenticated;
revoke execute on function lc_settle(uuid) from public, anon, authenticated;
revoke execute on function lc_record_bill(uuid, integer, uuid, uuid, integer, text, jsonb, jsonb, uuid) from public, anon, authenticated;
revoke execute on function lc_undo_bill(uuid, uuid) from public, anon, authenticated;

grant execute on function lc_generate_code() to service_role;
grant execute on function lc_settle(uuid) to service_role;
grant execute on function lc_record_bill(uuid, integer, uuid, uuid, integer, text, jsonb, jsonb, uuid) to service_role;
grant execute on function lc_undo_bill(uuid, uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lc-avatars', 'lc-avatars', true, 524288, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
