import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { buildRecommendations, buildTopTriggers, getDailyQuote, matchClinicalPatterns } from '../services/analytics.js';
import { getClientTimezone, getLocalDate } from '../services/time.js';
import { supabase } from '../supabase.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { toMoodLog } from '../utils/mappers.js';

export const analyticsRoutes = Router();

async function getUserAndLogs(userId) {
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .single();
  if (userError) throw userError;

  const { data: logs, error: logsError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false });
  if (logsError) throw logsError;
  return { user, logs: logs || [] };
}

analyticsRoutes.get('/analytics/dashboard', authRequired, asyncHandler(async (req, res) => {
  const { user, logs } = await getUserAndLogs(req.user.id);
  const timezone = req.query.timezone || req.user.timezone || 'UTC';
  const quote = await getDailyQuote(req.user.id, getLocalDate(timezone));
  const clinical = logs.length > 0 ? await matchClinicalPatterns(logs.slice(0, 20), 3) : { userPattern: null, matches: [] };
  const recommendation = logs.length > 0
    ? await buildRecommendations({ user, logs, type: 'dashboard' })
    : null;

  res.json({
    topTriggers: buildTopTriggers(logs),
    quote,
    pattern: clinical.userPattern,
    clinicalMatches: clinical.matches,
    recommendation,
  });
}));

analyticsRoutes.get('/analytics/weekly-report', authRequired, asyncHandler(async (req, res) => {
  const { user, logs } = await getUserAndLogs(req.user.id);
  const recentSeven = logs.slice(0, 7);
  const ready = recentSeven.length >= 7;
  const recommendation = ready
    ? await buildRecommendations({ user, logs, type: 'weekly_report' })
    : null;

  res.json({
    ready,
    requiredDays: 7,
    loggedDays: recentSeven.length,
    comparedLogs: Math.min(logs.length, 20),
    moodLogs: recentSeven.map(toMoodLog),
    topTriggers: buildTopTriggers(recentSeven),
    recommendation,
  });
}));

analyticsRoutes.post('/analytics/quote', authRequired, asyncHandler(async (req, res) => {
  const timezone = getClientTimezone(req.body);
  const quote = await getDailyQuote(req.user.id, getLocalDate(timezone));
  res.json({ quote });
}));
