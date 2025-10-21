-- USERS TABLE
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  name text,
  email text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (auth_user_id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_user();
