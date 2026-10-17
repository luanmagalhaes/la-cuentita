create table if not exists fs_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  phase text not null default 'LOBBY',
  target_score smallint not null default 200,
  round_number smallint not null default 1,
  host_player_id uuid,
  winner_player_id uuid,
  last_notice jsonb,
  created_at timestamp with time zone not null default now(),
  finished_at timestamp with time zone
);

create table if not exists fs_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references fs_rooms (id) on delete cascade,
  name text not null,
  avatar text,
  emoji text,
  seat smallint not null,
  total smallint not null default 0,
  created_at timestamp with time zone not null default now()
);

create table if not exists fs_player_secrets (
  room_id uuid not null references fs_rooms (id) on delete cascade,
  player_id uuid not null references fs_players (id) on delete cascade,
  access_token text not null,
  primary key (room_id, player_id)
);

create table if not exists fs_entries (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references fs_rooms (id) on delete cascade,
  player_id uuid not null references fs_players (id) on delete cascade,
  round_number smallint not null,
  numbers smallint[] not null default '{}',
  modifiers text[] not null default '{}',
  exit_kind text not null default 'STAY',
  total smallint not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists fs_entries_round_idx on fs_entries (room_id, player_id, round_number);
create index if not exists fs_players_room_idx on fs_players (room_id, seat);
create unique index if not exists fs_secrets_token_idx on fs_player_secrets (access_token);

alter table fs_rooms add constraint fs_rooms_phase_check check (phase in ('LOBBY', 'PLAYING', 'FINISHED'));
alter table fs_entries add constraint fs_entries_exit_check check (exit_kind in ('STAY', 'FREEZE', 'BUST'));

alter table fs_rooms enable row level security;
alter table fs_players enable row level security;
alter table fs_player_secrets enable row level security;
alter table fs_entries enable row level security;

create or replace function fs_generate_code() returns text as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  candidate text;
  taken boolean;
begin
  loop
    candidate := '';

    for i in 1..6 loop
      candidate := candidate || substr(alphabet, floor(random() * length(alphabet) + 1)::int, 1);
    end loop;

    select exists(select 1 from fs_rooms where code = candidate) into taken;

    if not taken then
      return candidate;
    end if;
  end loop;
end;
$$ language plpgsql;
