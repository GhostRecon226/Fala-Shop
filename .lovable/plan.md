

## Plan: Add Admin Ability to Delete Users

### Overview
Allow admins to delete other users from the user management page. This requires a new database function (since deleting from `auth.users` requires `SECURITY DEFINER` privileges) and a delete button with confirmation dialog in the UI.

### Changes

**1. Database migration — create `delete_user_by_admin` RPC**
- Create a `SECURITY DEFINER` function that:
  - Checks the caller has the `admin` role
  - Prevents self-deletion
  - Deletes the user from `auth.users` (cascades to `profiles`, `user_roles`, etc.)

```sql
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
```

**2. Update `src/pages/AdminUsers.tsx`**
- Add a delete button (trash icon) in each user row (hidden for the admin's own row)
- Add an `AlertDialog` confirmation before deletion
- Call `supabase.rpc('delete_user_by_admin', { _target_user_id })` on confirm
- Remove the user from local state and log the action
- Show toast on success/error

### Technical notes
- Deleting from `auth.users` cascades to `user_roles` and `profiles` via `ON DELETE CASCADE`
- Orders and reviews reference `user_id` but don't have cascade delete — those records will remain (preserving order history). If you want those deleted too, let me know.
- The confirmation dialog prevents accidental clicks

