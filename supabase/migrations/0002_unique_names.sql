create unique index if not exists lc_players_room_name_idx on lc_players (room_id, lower(name));
