import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { supabase } from '../supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationRoutes = Router();

notificationRoutes.get('/notifications', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('notifications').select('*').eq('to_user_id', req.user.id).order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ notifications: data });
}));

notificationRoutes.patch('/notifications/read-all', authRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('to_user_id', req.user.id);
  if (error) throw error;
  res.json({ read: true });
}));

