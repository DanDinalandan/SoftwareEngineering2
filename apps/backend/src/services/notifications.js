import { supabase } from '../supabase.js';
import { getDisplayTimestamp } from './time.js';

export async function pushNotification(payload) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      to_user_id: payload.toUserId,
      type: payload.type,
      message: payload.message,
      title: payload.title || null,
      icon: payload.icon || null,
      request_id: payload.requestId || null,
      provider_request_id: payload.providerRequestId || null,
      from_user_id: payload.fromUserId || null,
      to_provider_id: payload.toProviderId || null,
      from_provider_id: payload.fromProviderId || null,
      from_display_name: payload.fromDisplayName || null,
      display_timestamp: getDisplayTimestamp(payload.timezone || 'UTC'),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

