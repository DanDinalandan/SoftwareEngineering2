import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { buildRecommendations, getDailyQuote } from '../services/analytics.js';
import { pushNotification } from '../services/notifications.js';
import { getClientTimezone, getDisplayTimestamp, getLocalDate, getLocalDateTime } from '../services/time.js';
import { supabase } from '../supabase.js';
import { syncRewardsForUser } from '../services/rewards.js';
import { toMoodLog, toUser } from '../utils/mappers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { calculateRelapseRisk } from '../utils/patientInsights.js';
import { calculateAge } from '../utils/userFields.js';

export const userRoutes = Router();

// ── GET /user/me ───────────────────────────────────────────────────────────
userRoutes.get('/user/me', authRequired, asyncHandler(async (req, res) => {
  const { data: userData, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', req.user.id)
    .single();
  if (userError || !userData) return res.status(404).json({ error: 'User not found.' });

  const { data: moodLogs, error: logsError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('log_date', { ascending: false });
  if (logsError) throw logsError;

  const user = toUser(userData);
  user.moodLogs = (moodLogs || []).map(toMoodLog);

  res.json({ user });
}));

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
  const now = new Date().toISOString();
  const goal = req.body || null;
  const { data, error } = await supabase.from('app_users').update({ goal, updated_at: now }).eq('id', req.user.id).select('*').single();
  if (error) throw error;

  if (goal) {
    const { error: goalError } = await supabase
      .from('user_goals')
      .upsert({
        user_id: req.user.id,
        label: goal.label || '',
        daily_puff_limit: goal.dailyPuffLimit ?? null,
        weekly_goal: goal.weeklyGoal || '',
        color: goal.color || '',
        raw_goal: goal,
        active: true,
        updated_at: now,
      }, { onConflict: 'user_id' });
    if (goalError) throw goalError;
  }

  const rewards = await syncRewardsForUser(req.user.id);
  const { data: updatedUser, error: updatedUserError } = await supabase.from('app_users').select('*').eq('id', req.user.id).single();
  if (updatedUserError) throw updatedUserError;
  res.json({ user: toUser(updatedUser || data), newlyUnlocked: rewards.newlyUnlocked });
}));

userRoutes.patch('/user/phone', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('app_users').update({ phone: req.body.phone || '', updated_at: new Date().toISOString() }).eq('id', req.user.id).select('*').single();
  if (error) throw error;
  res.json({ user: toUser(data) });
}));

userRoutes.post('/mood', authRequired, asyncHandler(async (req, res) => {
  const tz = getClientTimezone(req.body);
  const now = new Date();
  const today = req.body.localDate || getLocalDate(tz, now);
  const triggers = Array.isArray(req.body.triggers) ? req.body.triggers : [];
  const vaped = Boolean(req.body.vaped);
  const relapseRisk = calculateRelapseRisk({ mood: req.body.mood, craving: req.body.craving, triggers });
  const pointsEarned = 10 + (!vaped ? 15 : 0);
  const vapedSessions = Array.isArray(req.body.vapedSessions) ? req.body.vapedSessions : [];
  const vapeMinutes = vaped ? Number(req.body.totalVapingMinutes ?? req.body.vapeMinutes ?? 0) : 0;

  const { data: freshUser, error: freshError } = await supabase
    .from('app_users')
    .select('streak, total_points, days_logged')
    .eq('id', req.user.id)
    .single();
  if (freshError || !freshUser) return res.status(500).json({ error: 'Could not fetch user data.' });

  const currentStreak = Number(freshUser.streak) || 0;
  const currentPoints = Number(freshUser.total_points) || 0;
  const currentDaysLogged = Number(freshUser.days_logged) || 0;
  const newStreak = !vaped ? currentStreak + 1 : 0;

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
      vape_minutes: vapeMinutes,
      vaped_sessions: vaped ? vapedSessions : [],
      vaped_hour: vaped ? req.body.vapedHour || null : null,
      comment: req.body.comment || '',
      relapse_risk: relapseRisk,
      points: pointsEarned,
      device_timezone: tz,
      local_logged_at: getLocalDateTime(tz, now),
      display_timestamp: getDisplayTimestamp(tz, now),
    })
    .select('*')
    .single();
  if (error?.code === '23505') return res.status(409).json({ error: 'Mood already logged today.' });
  if (error) throw error;

  const { data: updatedUser, error: updateError } = await supabase
    .from('app_users')
    .update({
      streak: newStreak,
      total_points: currentPoints + pointsEarned,
      days_logged: currentDaysLogged + 1,
      last_relapse_risk: relapseRisk,
      timezone: tz,
      updated_at: now.toISOString(),
    })
    .eq('id', req.user.id)
    .select('*')
    .single();
  if (updateError) throw updateError;

  if (updatedUser.connected_peer_user_id && updatedUser.progress_shared_with_peer) {
    const displayName = updatedUser.first_name || updatedUser.username;
    if (relapseRisk > 60 || ['Awful', 'Bad'].includes(req.body.mood)) {
      await pushNotification({ toUserId: updatedUser.connected_peer_user_id, type: 'high_risk', message: `${displayName} logged ${String(req.body.mood).toLowerCase()} mood with ${relapseRisk}% relapse risk. They may need support.`, timezone: tz });
    }
    if (vaped) await pushNotification({ toUserId: updatedUser.connected_peer_user_id, type: 'vaped', message: `${displayName} reported vaping today. Consider reaching out.`, timezone: tz });
  }

  const rewards = await syncRewardsForUser(req.user.id);
  const { data: latestLogs, error: logsError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('log_date', { ascending: false });
  if (logsError) throw logsError;
  const recommendation = await buildRecommendations({ user: updatedUser, logs: latestLogs || [], type: 'dashboard' });
  const quote = await getDailyQuote(req.user.id, today);

  res.status(201).json({
    entry: toMoodLog(entry),
    pointsEarned,
    newStreak,
    relapseRisk,
    newlyUnlocked: rewards.newlyUnlocked,
    recommendation,
    quote,
  });
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
    .update({
      streak: newStreak,
      total_points: Math.max(0, req.user.totalPoints - pointsReversed),
      days_logged: Math.max(0, (req.user.daysLogged || 0) - 1),
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user.id)
    .select('*')
    .single();
  if (updateError) throw updateError;
  await syncRewardsForUser(req.user.id);
  res.json({ message: 'Log deleted', pointsReversed, newStreak: updatedUser.streak });
}));
