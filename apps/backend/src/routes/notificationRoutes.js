import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { supabase } from '../supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationRoutes = Router();

notificationRoutes.get('/notifications', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('notifications').select('*').eq('to_user_id', req.user.id).order('created_at', { ascending: false });
  if (error) throw error;

  const requestIds = (data || [])
    .filter((notification) => notification.type === 'connection_request' && notification.request_id)
    .map((notification) => notification.request_id);
  const providerRequestIds = (data || [])
    .filter((notification) => notification.type === 'provider_connection_request' && notification.provider_request_id)
    .map((notification) => notification.provider_request_id);

  const pendingIds = new Set();
  const pendingProviderIds = new Set();

  if (requestIds.length > 0) {
    const { data: pendingRequests, error: requestError } = await supabase
      .from('connection_requests')
      .select('id')
      .in('id', requestIds)
      .eq('status', 'pending');
    if (requestError) throw requestError;
    pendingRequests?.forEach((request) => pendingIds.add(request.id));
  }

  if (providerRequestIds.length > 0) {
    const { data: pendingProviderRequests, error: providerRequestError } = await supabase
      .from('provider_patient_requests')
      .select('id')
      .in('id', providerRequestIds)
      .eq('status', 'pending');
    if (providerRequestError) throw providerRequestError;
    pendingProviderRequests?.forEach((request) => pendingProviderIds.add(request.id));
  }

  const staleIds = requestIds.filter((id) => !pendingIds.has(id));
  if (staleIds.length > 0) {
    await supabase.from('notifications').delete().in('request_id', staleIds).eq('type', 'connection_request');
  }
  const staleProviderIds = providerRequestIds.filter((id) => !pendingProviderIds.has(id));
  if (staleProviderIds.length > 0) {
    await supabase.from('notifications').delete().in('provider_request_id', staleProviderIds).eq('type', 'provider_connection_request');
  }

  res.json({
    notifications: (data || []).filter((notification) => (
      (
        notification.type !== 'connection_request'
        || !notification.request_id
        || pendingIds.has(notification.request_id)
      )
      && (
        notification.type !== 'provider_connection_request'
        || !notification.provider_request_id
        || pendingProviderIds.has(notification.provider_request_id)
      )
    )),
  });
}));

notificationRoutes.patch('/notifications/read-all', authRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('to_user_id', req.user.id);
  if (error) throw error;
  res.json({ read: true });
}));

notificationRoutes.delete('/notifications', authRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').delete().eq('to_user_id', req.user.id);
  if (error) throw error;
  res.json({ success: true });
}));

