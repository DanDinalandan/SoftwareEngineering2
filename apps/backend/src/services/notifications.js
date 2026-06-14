import { supabase } from '../supabase.js';

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
      from_user_id: payload.fromUserId || null,
      from_display_name: payload.fromDisplayName || null,
      display_timestamp: new Date().toLocaleString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

