import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { supabase } from '../supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const messageRoutes = Router();

messageRoutes.get('/messages/:withUserId', authRequired, asyncHandler(async (req, res) => {
  const withUserId = req.params.withUserId;
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(from_user_id.eq.${req.user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${req.user.id})`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  res.json({ messages: data });
}));

messageRoutes.post('/messages', authRequired, asyncHandler(async (req, res) => {
  if (!req.body.toUserId || !String(req.body.text || '').trim()) return res.status(400).json({ error: 'toUserId and text are required.' });
  const { data, error } = await supabase
    .from('messages')
    .insert({
      from_user_id: req.user.id,
      to_user_id: req.body.toUserId,
      text: String(req.body.text).trim(),
      subject: req.body.subject || null,
      display_timestamp: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' }),
    })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json({ message: data });
}));

