import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { pushNotification } from '../services/notifications.js';
import { supabase } from '../supabase.js';
import { toMoodLog, toUser } from '../utils/mappers.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const connectionRoutes = Router();

async function findUserByUsername(username) {
  const { data, error } = await supabase.from('app_users').select('*').eq('username', String(username || '').trim().toLowerCase()).single();
  if (error) return null;
  return data;
}

connectionRoutes.post('/connections/request', authRequired, asyncHandler(async (req, res) => {
  const target = await findUserByUsername(req.body.toUsername);
  if (!target) return res.status(404).json({ error: 'User not found.' });
  if (req.user.role === 'Peer' && target.role !== 'Vape User') return res.status(400).json({ error: 'You can only connect to Vape Users.' });
  if (req.user.role === 'Vape User' && target.role !== 'Peer') return res.status(400).json({ error: 'You can only connect to Peer Supporters.' });
  if (req.user.connectedPeerUserId || req.user.connectedVapeUserId || target.connected_peer_user_id || target.connected_vape_user_id) {
    return res.status(409).json({ error: 'One of these users is already connected.' });
  }

  const { data: existing } = await supabase.from('connection_requests').select('*').eq('from_user_id', req.user.id).eq('to_user_id', target.id).eq('status', 'pending').maybeSingle();
  if (existing) return res.status(409).json({ error: 'Request already sent.' });

  const { data: request, error } = await supabase.from('connection_requests').insert({ from_user_id: req.user.id, to_user_id: target.id }).select('*').single();
  if (error) throw error;

  const senderName = req.user.firstName ? `${req.user.firstName} ${req.user.lastName}`.trim() : req.user.username;
  await pushNotification({
    toUserId: target.id,
    fromUserId: req.user.id,
    fromDisplayName: senderName,
    requestId: request.id,
    type: 'connection_request',
    message: `${senderName} wants to be your peer supporter. Accept to let them see your progress.`,
  });
  res.status(201).json({ request });
}));

connectionRoutes.patch('/connections/:requestId', authRequired, asyncHandler(async (req, res) => {
  const { data: request, error: requestError } = await supabase.from('connection_requests').select('*').eq('id', req.params.requestId).eq('to_user_id', req.user.id).single();
  if (requestError || !request) return res.status(404).json({ error: 'Request not found.' });
  if (request.status !== 'pending') return res.status(409).json({ error: 'Request is already resolved.' });

  const accept = Boolean(req.body.accept);
  const { error: statusError } = await supabase.from('connection_requests').update({ status: accept ? 'accepted' : 'rejected' }).eq('id', request.id);
  if (statusError) throw statusError;

  if (!accept) {
    await pushNotification({ toUserId: request.from_user_id, fromUserId: req.user.id, type: 'connection_rejected', message: `${req.user.firstName || req.user.username} declined your connection request.` });
    return res.json({ accepted: false });
  }

  const { data: fromUser, error: fromError } = await supabase.from('app_users').select('*').eq('id', request.from_user_id).single();
  if (fromError) throw fromError;
  const peer = fromUser.role === 'Peer' ? fromUser : req.userRow;
  const vapeUser = fromUser.role === 'Vape User' ? fromUser : req.userRow;

  const results = await Promise.all([
    supabase.from('app_users').update({
      connected_vape_user_id: vapeUser.id,
      connected_vape_user_username: vapeUser.username,
      vape_user_relationship_label: req.body.relationship || null,
      updated_at: new Date().toISOString(),
    }).eq('id', peer.id),
    supabase.from('app_users').update({
      connected_peer_user_id: peer.id,
      connected_peer_username: peer.username,
      peer_relationship: req.body.relationship || null,
      progress_shared_with_peer: true,
      updated_at: new Date().toISOString(),
    }).eq('id', vapeUser.id),
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  await pushNotification({ toUserId: peer.id, fromUserId: vapeUser.id, type: 'connection_accepted', message: `${vapeUser.first_name || vapeUser.username} accepted your connection request! You are now their peer supporter.` });
  res.json({ accepted: true });
}));

connectionRoutes.delete('/connections', authRequired, asyncHandler(async (req, res) => {
  const partnerId = req.user.connectedPeerUserId || req.user.connectedVapeUserId;
  if (!partnerId) return res.json({ disconnected: false });
  const clear = {
    connected_peer_user_id: null,
    connected_vape_user_id: null,
    connected_peer_username: null,
    connected_vape_user_username: null,
    peer_relationship: null,
    progress_shared_with_peer: false,
    vape_user_relationship_label: null,
    updated_at: new Date().toISOString(),
  };
  const results = await Promise.all([
    supabase.from('app_users').update(clear).eq('id', req.user.id),
    supabase.from('app_users').update(clear).eq('id', partnerId),
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;
  res.json({ disconnected: true });
}));

connectionRoutes.get('/connections/peer-user', authRequired, asyncHandler(async (req, res) => {
  if (req.user.role !== 'Peer') return res.status(403).json({ error: 'Peer only.' });
  if (!req.user.connectedVapeUserId) return res.status(404).json({ error: 'No connected vape user.' });

  const { data: user, error: userError } = await supabase.from('app_users').select('*').eq('id', req.user.connectedVapeUserId).single();
  if (userError) throw userError;
  const { data: moodLogs, error: moodError } = await supabase.from('mood_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false });
  if (moodError) throw moodError;
  res.json({ user: toUser(user), moodLogs: moodLogs.map(toMoodLog), lastRelapseRisk: user.last_relapse_risk });
}));

connectionRoutes.get('/connections/pending', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*, from_user:from_user_id(username, first_name, last_name, role)')
    .eq('to_user_id', req.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ requests: data });
}));

