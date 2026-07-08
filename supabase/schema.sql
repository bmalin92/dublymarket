create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  ip_address text,
  voter_name text not null,
  healer text not null,
  voted_at timestamptz not null default now()
);

create index if not exists votes_device_id_voted_at_idx on votes (device_id, voted_at);
