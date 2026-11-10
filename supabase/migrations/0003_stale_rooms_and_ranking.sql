alter table lc_matches
  add column if not exists closed_by text not null default 'target';

create index if not exists lc_rooms_started_idx on lc_rooms (phase, started_at);

create or replace function lc_close_stale(p_hours integer) returns text[]
language plpgsql
security definer
as $$
declare
  room_row lc_rooms%rowtype;
  winners text[];
  ranking jsonb;
  bar_count integer;
  closed text[] := '{}';
begin
  for room_row in
    select * from lc_rooms
     where phase = 'PLAYING'
       and started_at is not null
       and started_at < now() - make_interval(hours => p_hours)
  loop
    with standing as (
      select player.name,
             player.seat,
             room_row.starting_savings - coalesce(sum(share.amount), 0) as savings
        from lc_players player
        left join lc_bill_shares share on share.player_id = player.id
       where player.room_id = room_row.id
       group by player.id, player.name, player.seat
    )
    select jsonb_agg(jsonb_build_object('name', name, 'savings', savings) order by savings desc, seat),
           array_agg(name order by seat) filter (where savings = (select max(inner_standing.savings) from standing inner_standing))
      into ranking, winners
      from standing;

    select count(*) into bar_count from lc_bills where room_id = room_row.id;

    update lc_rooms set phase = 'FINISHED', finished_at = now() where id = room_row.id and phase = 'PLAYING';

    if found then
      if not room_row.is_test then
        insert into lc_matches (room_id, room_code, winner_names, players, bars, starting_savings, closed_by)
        values (room_row.id, room_row.code, coalesce(winners, '{}'), coalesce(ranking, '[]'::jsonb), bar_count, room_row.starting_savings, 'timeout');
      end if;

      closed := closed || room_row.code;
    end if;
  end loop;

  return closed;
end;
$$;
