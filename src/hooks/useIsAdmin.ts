import { useRole } from './useRole';

/**
 * Backwards-compatible hook. Returns `true` for any admin-tier role
 * (super_admin or admin). For moderator-only checks, use `useRole()`.
 */
export const useIsAdmin = () => {
  const { isAdmin, isLoading, isFetching } = useRole();
  return {
    data: isAdmin,
    isLoading,
    isFetching,
  };
};
