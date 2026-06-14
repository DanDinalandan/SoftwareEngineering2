import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { pushNotification } from '../services/notifications.js';
import { supabase } from '../supabase.js';
import { toMoodLog, toUser } from '../utils/mappers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateRelapseRisk } from '../utils/patientInsights.js';
import { calculateAge } from '../utils/userFields.js';

export const userRoutes = Router();

userRoutes.patch('/user/profile', authRequired, asyncHandler(async (req, res) => {
  const age = req.body.birthday ? calculateAge(req.body.birthday) : req.body.age;
  if (age !== null && age !== undefined && age !== '') {
    if (Number(age) < 18) return res.status(400).json({ error: 'Must be at least 18 years old.' });
    if (Number(age) > 99) return res.status(400).json({ error: 'Age must be 99 or below.' });
  }

  const update = {
    first_name: req.body.firstName,
    last_name: req.body.lastName,
    middle_name: req.body.middleName,
    suffix: req.body.suffix,
    birthday: req.body.birthday,
    age,
    gender: req.body.gender,
    vape_types: req.body.vapeTypes || [],
    profile_complete: true,
    updated_at: new Date().toISOString(),
  };
  if (req.body.role) update.role = req.body.role;

  const { data, error } = await supabase.from('app_users').update(update).eq('id', req.user.id).select('*').single();
  if (error) throw error;
  res.json({ user: toUser(data) });
}));

userRoutes.put('/user/role', authRequired, asyncHandler(async (req, res) => {
  if (!['Vape User', 'Peer'].includes(req.body.role)) return res.status(400).json({ error: 'Role must be Vape User or Peer.' });
  const { data, error } = await supabase.from('app_users').update({ role: req.body.role, updated_at: new Date().toISOString() }).eq('id', req.user.id).select('*').single();
  if (error) throw error;
  res.json({ user: toUser(data) });
}));

userRoutes.put('/user/goal', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('app_users').update({ goal: req.body, updated_at: new Date().toISOString() }).eq('id', req.user.id).select('*').single();
  if (error) throw error;
  res.json({ user: toUser(data) });
}));

userRoutes.patch('/user/phone', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('app_users').update({ phone: req.body.phone || '', updated_at: new Date().toISOString() }).eq('id', req.user.id).select('*').single();
  if (error) throw error;
  res.json({ user: toUser(data) });
}));

userRoutes.post('/mood', authRequired, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const triggers = Array.isArray(req.body.triggers) ? req.body.triggers : [];
  const vaped = Boolean(req.body.vaped);
  const relapseRisk = calculateRelapseRisk({ mood: req.body.mood, craving: req.body.craving, triggers });
  const pointsEarned = 10 + (!vaped ? 15 : 0);
  const newStreak = !vaped ? req.user.streak + 1 : 0;

  const { data: entry, error } = await supabase
    .from('mood_logs')
    .insert({
      user_id: req.user.id,
      log_date: today,
      mood: req.body.mood,
      triggers,
      craving: Number(req.body.craving),
      vaped,
      puffs_today: vaped ? Number(req.body.puffsToday || 0) : 0,
      vaped_hour: vaped ? req.body.vapedHour || null : null,
      comment: req.body.comment || '',
      relapse_risk: relapseRisk,
      points: pointsEarned,
      display_timestamp: new Date().toLocaleString(),
    })
    .select('*')
    .single();
  if (error?.code === '23505') return res.status(409).json({ error: 'Mood already logged today.' });
  if (error) throw error;

  const { data: updatedUser, error: updateError } = await supabase
    .from('app_users')
    .update({ streak: newStreak, total_points: req.user.totalPoints + pointsEarned, last_relapse_risk: relapseRisk, updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();
  if (updateError) throw updateError;

  if (updatedUser.connected_peer_user_id && updatedUser.progress_shared_with_peer) {
    const displayName = updatedUser.first_name || updatedUser.username;
    if (relapseRisk > 60 || ['Awful', 'Bad'].includes(req.body.mood)) {
      await pushNotification({ toUserId: updatedUser.connected_peer_user_id, type: 'high_risk', message: `${displayName} logged ${String(req.body.mood).toLowerCase()} mood with ${relapseRisk}% relapse risk. They may need support.` });
    }
    if (vaped) await pushNotification({ toUserId: updatedUser.connected_peer_user_id, type: 'vaped', message: `${displayName} reported vaping today. Consider reaching out.` });
  }

  res.status(201).json({ entry: toMoodLog(entry), pointsEarned, newStreak, relapseRisk });
}));

userRoutes.get('/mood', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('mood_logs').select('*').eq('user_id', req.user.id).order('log_date', { ascending: false });
  if (error) throw error;
  res.json({ moodLogs: data.map(toMoodLog) });
}));

userRoutes.delete('/mood/:id', authRequired, asyncHandler(async (req, res) => {
  const { data: entry, error: getError } = await supabase.from('mood_logs').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single();
  if (getError || !entry) return res.status(404).json({ error: 'Mood log not found.' });
  const { error: deleteError } = await supabase.from('mood_logs').delete().eq('id', entry.id);
  if (deleteError) throw deleteError;

  const pointsReversed = entry.points || 0;
  const newStreak = !entry.vaped && req.user.streak > 0 ? req.user.streak - 1 : req.user.streak;
  const { data: updatedUser, error: updateError } = await supabase
    .from('app_users')
    .update({ streak: newStreak, total_points: Math.max(0, req.user.totalPoints - pointsReversed), updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();
  if (updateError) throw updateError;
  res.json({ message: 'Log deleted', pointsReversed, newStreak: updatedUser.streak });
}));

