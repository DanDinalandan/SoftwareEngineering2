import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { config } from '../config.js';
import { supabase } from '../supabase.js';
import { providerAuthRequired } from '../middleware/auth.js';
import { signProviderToken } from '../services/tokens.js';
import { toMoodLog, toProvider } from '../utils/mappers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { mapDbError } from '../utils/userFields.js';
import { buildPatientInsights, patientFromUser } from '../utils/patientInsights.js';

export const providerRoutes = Router();

function toProviderNotification(row) {
  const title = row.title || row.message.split('.')[0] || 'Notification';
  return {
    id: row.id,
    type: row.type,
    icon: row.icon || (row.type === 'high_risk' || row.type === 'alert' ? '🚨' : row.type === 'vaped' ? '🔁' : '📋'),
    title,
    desc: row.message,
    time: row.display_timestamp || new Date(row.created_at).toLocaleString(),
    unread: !row.read,
  };
}

providerRoutes.post('/register', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const license = String(req.body.license || '').trim();
  if (!email || !password || !license || !req.body.firstName || !req.body.lastName) {
    return res.status(400).json({ error: 'Email, password, license, firstName, and lastName are required.' });
  }

  const { data, error } = await supabase
    .from('providers')
    .insert({
      email,
      password_hash: await bcrypt.hash(password, config.bcryptRounds),
      license,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      middle_name: req.body.middleName || '',
      suffix: req.body.suffix || '',
      gender: req.body.gender || '',
      dob: req.body.dob || null,
      department: req.body.department || 'Cessation Clinic',
      phone: req.body.phone || '',
    })
    .select('*')
    .single();

  if (error) {
    const mapped = mapDbError(error);
    return res.status(mapped.status).json({ error: mapped.message });
  }

  const provider = toProvider(data);
  res.status(201).json({ token: signProviderToken(provider), provider });
}));

providerRoutes.post('/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { data, error } = await supabase.from('providers').select('*').eq('email', email).single();
  if (error || !data || !(await bcrypt.compare(password, data.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials. Please check and try again.' });
  }

  const provider = toProvider(data);
  res.json({ token: signProviderToken(provider), provider });
}));

providerRoutes.get('/me', providerAuthRequired, (req, res) => {
  res.json({ provider: req.provider });
});

providerRoutes.get('/patients', providerAuthRequired, asyncHandler(async (_req, res) => {
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('*')
    .eq('role', 'Vape User')
    .order('created_at', { ascending: false });
  if (usersError) throw usersError;

  const ids = users.map((user) => user.id);
  const { data: logs, error: logsError } = ids.length
    ? await supabase.from('mood_logs').select('*').in('user_id', ids).order('created_at', { ascending: false })
    : { data: [], error: null };
  if (logsError) throw logsError;

  const latestByUser = new Map();
  logs.forEach((log) => {
    if (!latestByUser.has(log.user_id)) latestByUser.set(log.user_id, log);
  });

  res.json({ patients: users.map((user) => patientFromUser(user, latestByUser.get(user.id))) });
}));

providerRoutes.get('/patients/:patientId/dashboard', providerAuthRequired, asyncHandler(async (req, res) => {
  const { user, logs } = await getPatientWithLogs(req.params.patientId);
  if (!user) return res.status(404).json({ error: 'Patient not found.' });
  const latest = logs[0];
  const insights = buildPatientInsights(user, logs);
  res.json({
    info: patientFromUser(user, latest),
    todaysLog: latest && latest.log_date === new Date().toISOString().slice(0, 10)
      ? { mood: latest.mood, triggers: latest.triggers || [], vapedToday: latest.vaped ? 'Yes' : 'No' }
      : null,
    insights: {
      riskScore: insights.riskScore,
      riskLevel: insights.riskLevel,
      cravingLevel: insights.cravingLevel,
      correlation: insights.correlation,
      streaks: insights.streaks,
    },
  });
}));

providerRoutes.get('/patients/:patientId/profile', providerAuthRequired, asyncHandler(async (req, res) => {
  const { user, logs } = await getPatientWithLogs(req.params.patientId);
  if (!user) return res.status(404).json({ error: 'Patient not found.' });
  res.json({ info: patientFromUser(user, logs[0]), insights: buildPatientInsights(user, logs) });
}));

providerRoutes.get('/patients/:patientId/logs', providerAuthRequired, asyncHandler(async (req, res) => {
  const { user, logs } = await getPatientWithLogs(req.params.patientId);
  if (!user) return res.status(404).json({ error: 'Patient not found.' });
  res.json({ logs: logs.map(toMoodLog) });
}));

providerRoutes.get('/messages', providerAuthRequired, asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, from_user:from_user_id(username, first_name, last_name, gender), to_user:to_user_id(username, first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  res.json({
    messages: data.map((message) => {
      const sender = message.from_user || {};
      const patientName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.username || 'Patient';
      return {
        id: message.id,
        patientName,
        patientEmoji: sender.gender === 'Male' ? '👨' : sender.gender === 'Female' ? '👩' : '👤',
        subject: message.subject || 'Patient message',
        preview: message.text,
        body: message.text,
        time: message.display_timestamp || new Date(message.created_at).toLocaleString(),
        unread: !message.read_by_provider,
      };
    }),
  });
}));

providerRoutes.patch('/messages/:messageId/read', providerAuthRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('messages').update({ read_by_provider: true }).eq('id', req.params.messageId);
  if (error) throw error;
  res.json({ success: true, id: req.params.messageId });
}));

providerRoutes.post('/messages/:messageId/reply', providerAuthRequired, asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Reply text is required.' });

  const { data: original, error: originalError } = await supabase.from('messages').select('*').eq('id', req.params.messageId).single();
  if (originalError || !original) return res.status(404).json({ error: 'Message not found.' });

  const { data, error } = await supabase
    .from('provider_messages')
    .insert({
      provider_id: req.provider.id,
      to_user_id: original.from_user_id,
      original_message_id: original.id,
      text,
      display_timestamp: new Date().toLocaleString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json({ success: true, id: req.params.messageId, reply: data });
}));

providerRoutes.get('/notifications', providerAuthRequired, asyncHandler(async (_req, res) => {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  res.json({ notifications: data.map(toProviderNotification) });
}));

providerRoutes.patch('/notifications/:notificationId/read', providerAuthRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', req.params.notificationId);
  if (error) throw error;
  res.json({ success: true, id: req.params.notificationId });
}));

providerRoutes.patch('/notifications/read-all', providerAuthRequired, asyncHandler(async (_req, res) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('read', false);
  if (error) throw error;
  res.json({ success: true });
}));

async function getPatientWithLogs(patientId) {
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', patientId)
    .eq('role', 'Vape User')
    .maybeSingle();
  if (userError) throw userError;
  if (!user) return { user: null, logs: [] };

  const { data: logs, error: logsError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false });
  if (logsError) throw logsError;
  return { user, logs };
}

