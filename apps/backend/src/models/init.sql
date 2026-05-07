create extension if not exists "citext";
create extension if not exists "pgcrypto";
create extension if not exists "postgis";
create extension if not exists "pg_cron";

select cron.schedule(
    'purge-expired-sessions',
    '0 3 * * *',
    $$DELETE FROM sessions WHERE expires_at < NOW()$$
);

create domain email as citext check ( value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$');

create table users (
    user_id             UUID primary key default gen_random_uuid(),
    email               email not null,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

create table user_restaurants (
    user_restaurant_id  UUID primary key default gen_random_uuid(),
    user_id             UUID not null references users(user_id) on delete cascade,
    name                varchar(127) not null,
    address             varchar(127),
    location            GEOGRAPHY(Point, 4326) not null,
    rating              int check (rating is null or rating between 1 and 10),
    price_range         int check (price_range is null or price_range between 1 and 5),
    descriptors         text[],
    menu_items          text[],
    notes               text,
    created_at          timestamptz default now(),
    updated_at          timestamptz default now()
);

create table oauth_accounts (
	oauth_account_id    UUID primary key default gen_random_uuid(),
	user_id 		    UUID not null references users(user_id) on delete cascade,
	provider            text not null,
	provider_user_id    text not null,
	email               email not null, 
	created_at          timestamptz default now(),
	unique (provider, provider_user_id)
);

create table sessions (
    session_row_id       uuid primary key default gen_random_uuid(),
    session_token_hash   text not null unique,
    user_id              uuid not null references users(user_id) on delete cascade,
    created_at           timestamptz not null default now(),
    last_used_at         timestamptz not null default now(),
    expires_at           timestamptz not null,
    revoked_at           timestamptz
);

create index sessions_token_hash_idx on sessions (session_token_hash);

create table pending_oauth (
  state                 text primary key,
  code_verifier         text not null,
  expires_at            timestamptz not null
);

select cron.schedule('cleanup-pending-oauth', '*/10 * * * *',
  $$delete from pending_oauth where expires_at < NOW()$$
);