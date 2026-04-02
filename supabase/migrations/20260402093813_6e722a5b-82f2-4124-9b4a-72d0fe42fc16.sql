
create or replace function public.delete_user_by_admin(_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::app_role) then
    raise exception 'Not authorized';
  end if;
  if _target_user_id = auth.uid() then
    raise exception 'Cannot delete yourself';
  end if;
  delete from auth.users where id = _target_user_id;
end;
$$;
