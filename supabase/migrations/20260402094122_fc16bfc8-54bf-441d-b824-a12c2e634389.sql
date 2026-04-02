
drop function if exists public.list_users_with_roles();

create or replace function public.list_users_with_roles()
returns table(user_id uuid, email text, created_at timestamptz, role text, is_banned boolean)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    u.email::text as email,
    u.created_at,
    ur.role::text as role,
    (u.banned_until is not null and u.banned_until > now()) as is_banned
  from auth.users u
  left join public.user_roles ur on ur.user_id = u.id
  where public.has_role(auth.uid(), 'admin'::app_role)
  order by u.created_at desc;
$$;
