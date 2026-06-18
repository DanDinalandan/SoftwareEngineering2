import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { supabase } from '../supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const messageRoutes = Router();

async function findUserByUsername(username) {
  const { data, error } = await supabase.from('app_users').select('id').eq('username', String(username || '').trim().toLowerCase()).single();
  if (error || !data) return null;
  return data.id;
}

function isConnectedPair(user, otherUserId) {
  return user.connectedPeerUserId === otherUserId || user.connectedVapeUserId === otherUserId;
}

messageRoutes.get('/messages/:withUsername', authRequired, asyncHandler(async (req, res) => {
  const withUsername = req.params.withUsername;
  const withUserId = await findUserByUsername(withUsername);
  if (!withUserId) return res.status(404).json({ error: 'User not found.' });
  if (!isConnectedPair(req.user, withUserId)) return res.json({ messages: [] });
  
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      from_user_id,
      to_user_id,
      text,
      subject,
      display_timestamp,
      from_user:from_user_id(username),
      to_user:to_user_id(username)
    `)
    .or(`and(from_user_id.eq.${req.user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${req.user.id})`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  
  const messages = (data || []).map((m) => ({
    id: m.id,
    fromUserId: m.from_user_id,
    toUserId: m.to_user_id,
    fromUsername: m.from_user?.username,
    toUsername: m.to_user?.username,
    text: m.text,
    subject: m.subject,
    timestamp: m.display_timestamp,
  }));
  
  res.json({ messages });
}));

messageRoutes.post('/messages', authRequired, asyncHandler(async (req, res) => {
  const toUsername = req.body.toUsername;
  const text = String(req.body.text || '').trim();
  
  if (!toUsername || !text) return res.status(400).json({ error: 'toUsername and text are required.' });
  
  const toUserId = await findUserByUsername(toUsername);
  if (!toUserId) return res.status(404).json({ error: 'User not found.' });
  if (!isConnectedPair(req.user, toUserId)) return res.status(403).json({ error: 'You can only message your connected peer support partner.' });
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      from_user_id: req.user.id,
      to_user_id: toUserId,
      text,
      subject: req.body.subject || null,
      display_timestamp: new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' }),
    })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json({ message: data });
}));

