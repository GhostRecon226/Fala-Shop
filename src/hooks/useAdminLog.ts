import { supabase } from '@/integrations/supabase/client';

export const logAdminAction = async (
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) => {
  await supabase.rpc('log_admin_action', {
    _action: action,
    _entity_type: entityType,
    _entity_id: entityId ?? null,
    _details: details ?? {},
  });
};
