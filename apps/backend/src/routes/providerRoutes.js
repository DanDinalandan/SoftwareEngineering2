import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { config } from '../config.js';
import { supabase } from '../supabase.js';
import { providerAuthRequired } from '../middleware/auth.js';
import { pushNotification } from '../services/notifications.js';
import { signProviderToken } from '../services/tokens.js';
import { toMoodLog, toProvider } from '../utils/mappers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { mapDbError } from '../utils/userFields.js';
import { buildPatientInsights, patientFromUser } from '../utils/patientInsights.js';

export const providerRoutes = Router();
const MAX_PROVIDER_PATIENTS = 10;

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

function providerDisplayName(provider) {
  return `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || provider.email;
}

async function getConnectedPatientIds(providerId) {
  const { data, error } = await supabase
    .from('provider_patient_connections')
    .select('vape_user_id')
    .eq('provider_id', providerId)
    .eq('active', true);
  if (error) throw error;
  return (data || []).map((row) => row.vape_user_id);
}

async function assertProviderPatient(providerId, patientId) {
  const { data, error } = await supabase
    .from('provider_patient_connections')
    .select('provider_id')
    .eq('provider_id', providerId)
    .eq('vape_user_id', patientId)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
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

providerRoutes.patch('/me', providerAuthRequired, asyncHandler(async (req, res) => {
  const update = {
    first_name: req.body.firstName ?? req.body.first_name ?? req.provider.firstName,
    last_name: req.body.lastName ?? req.body.last_name ?? req.provider.lastName,
    middle_name: req.body.middleName ?? req.body.middle_name ?? req.provider.middleName,
    suffix: req.body.suffix ?? req.provider.suffix,
    department: req.body.department ?? req.provider.department,
    phone: req.body.phone ?? req.provider.phone,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('providers').update(update).eq('id', req.provider.id).select('*').single();
  if (error) throw error;
  res.json({ provider: toProvider(data) });
}));

providerRoutes.patch('/password', providerAuthRequired, asyncHandler(async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password are required.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });

  const { data: provider, error } = await supabase.from('providers').select('*').eq('id', req.provider.id).single();
  if (error || !provider || !(await bcrypt.compare(currentPassword, provider.password_hash))) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  const { error: updateError } = await supabase
    .from('providers')
    .update({ password_hash: await bcrypt.hash(newPassword, config.bcryptRounds), updated_at: new Date().toISOString() })
    .eq('id', req.provider.id);
  if (updateError) throw updateError;
  res.json({ success: true });
}));

providerRoutes.patch('/notification-preferences', providerAuthRequired, asyncHandler(async (req, res) => {
  const preferences = req.body.preferences || req.body || {};
  const { data, error } = await supabase
    .from('providers')
    .update({ notification_preferences: preferences, updated_at: new Date().toISOString() })
    .eq('id', req.provider.id)
    .select('*')
    .single();
  if (error) throw error;
  res.json({ provider: toProvider(data) });
}));

providerRoutes.get('/patients', providerAuthRequired, asyncHandler(async (req, res) => {
  const ids = await getConnectedPatientIds(req.provider.id);
  if (ids.length === 0) return res.json({ patients: [] });

  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('*')
    .in('id', ids)
    .eq('role', 'Vape User')
    .order('created_at', { ascending: false });
  if (usersError) throw usersError;

  const { data: logs, error: logsError } = await supabase.from('mood_logs').select('*').in('user_id', ids).order('created_at', { ascending: false });
  if (logsError) throw logsError;

  const latestByUser = new Map();
  logs.forEach((log) => {
    if (!latestByUser.has(log.user_id)) latestByUser.set(log.user_id, log);
  });

  res.json({ patients: users.map((user) => patientFromUser(user, latestByUser.get(user.id))) });
}));

providerRoutes.post('/patients/request', providerAuthRequired, asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Patient email is required.' });

  const currentIds = await getConnectedPatientIds(req.provider.id);
  if (currentIds.length >= MAX_PROVIDER_PATIENTS) return res.status(409).json({ error: 'Provider patient limit reached. Maximum is 10 vape users.' });

  const { data: user, error: userError } = await supabase.from('app_users').select('*').eq('email', email).eq('role', 'Vape User').maybeSingle();
  if (userError) throw userError;
  if (!user) return res.status(404).json({ error: 'Vape user not found for that email.' });
  if (user.connected_peer_user_id || user.connected_provider_id) {
    return res.status(409).json({ error: 'This vape user already has a peer supporter or provider.' });
  }

  const { data: existingConnection, error: connectionError } = await supabase
    .from('provider_patient_connections')
    .select('*')
    .eq('vape_user_id', user.id)
    .eq('active', true)
    .maybeSingle();
  if (connectionError) throw connectionError;
  if (existingConnection) return res.status(409).json({ error: 'This vape user is already connected to a provider.' });

  const { data: existing } = await supabase
    .from('provider_patient_requests')
    .select('*')
    .eq('provider_id', req.provider.id)
    .eq('vape_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing) return res.status(409).json({ error: 'Request already sent.' });

  const { data: request, error } = await supabase
    .from('provider_patient_requests')
    .insert({ provider_id: req.provider.id, vape_user_id: user.id })
    .select('*')
    .single();
  if (error) throw error;

  const name = providerDisplayName(req.providerRow);
  await pushNotification({
    toUserId: user.id,
    fromProviderId: req.provider.id,
    fromDisplayName: name,
    providerRequestId: request.id,
    type: 'provider_connection_request',
    title: 'Provider monitoring request',
    message: `${name} wants to monitor your vape cessation progress. Accepting will share your logs, goals, streak, and relapse risk with this provider.`,
  });

  res.status(201).json({ request });
}));

providerRoutes.delete('/patients/:patientId', providerAuthRequired, asyncHandler(async (req, res) => {
  const patientId = req.params.patientId;
  const connected = await assertProviderPatient(req.provider.id, patientId);
  if (!connected) return res.status(404).json({ error: 'Patient connection not found.' });

  const { data: patient, error: patientError } = await supabase.from('app_users').select('*').eq('id', patientId).single();
  if (patientError) throw patientError;

  const results = await Promise.all([
    supabase.from('provider_patient_connections').update({ active: false, updated_at: new Date().toISOString() }).eq('provider_id', req.provider.id).eq('vape_user_id', patientId),
    supabase.from('app_users').update({ connected_provider_id: null, connected_provider_name: null, updated_at: new Date().toISOString() }).eq('id', patientId),
  ]);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  await pushNotification({
    toUserId: patientId,
    fromProviderId: req.provider.id,
    type: 'provider_connection_removed',
    title: 'Provider removed',
    message: `${providerDisplayName(req.providerRow)} removed you from their monitoring list.`,
  });

  res.json({ removed: true, patient: patientFromUser(patient, null) });
}));

providerRoutes.get('/patients/:patientId/dashboard', providerAuthRequired, asyncHandler(async (req, res) => {
  const { user, logs } = await getPatientWithLogs(req.provider.id, req.params.patientId);
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
  const { user, logs } = await getPatientWithLogs(req.provider.id, req.params.patientId);
  if (!user) return res.status(404).json({ error: 'Patient not found.' });
  res.json({ info: patientFromUser(user, logs[0]), insights: buildPatientInsights(user, logs) });
}));

providerRoutes.get('/patients/:patientId/logs', providerAuthRequired, asyncHandler(async (req, res) => {
  const { user, logs } = await getPatientWithLogs(req.provider.id, req.params.patientId);
  if (!user) return res.status(404).json({ error: 'Patient not found.' });
  res.json({ logs: logs.map(toMoodLog) });
}));

providerRoutes.get('/messages', providerAuthRequired, asyncHandler(async (req, res) => {
  const patientIds = await getConnectedPatientIds(req.provider.id);
  if (patientIds.length === 0) return res.json({ messages: [] });

  const { data: inbound, error: inboundError } = await supabase
    .from('messages')
    .select('*, from_user:from_user_id(username, first_name, last_name, gender), to_user:to_user_id(username, first_name, last_name)')
    .in('from_user_id', patientIds)
    .order('created_at', { ascending: false })
    .limit(50);
  if (inboundError) throw inboundError;

  const { data: outbound, error: outboundError } = await supabase
    .from('provider_messages')
    .select('*, to_user:to_user_id(username, first_name, last_name, gender)')
    .eq('provider_id', req.provider.id)
    .in('to_user_id', patientIds)
    .order('created_at', { ascending: false })
    .limit(50);
  if (outboundError) throw outboundError;

  const inboundMessages = (inbound || []).map((message) => {
    const sender = message.from_user || {};
    const patientName = `${sender.first_name || ''} ${sender.last_name || ''}`.trim() || sender.username || 'Patient';
    return {
      id: message.id,
      patientId: message.from_user_id,
      patientName,
      patientEmoji: sender.gender === 'Male' ? '👨' : sender.gender === 'Female' ? '👩' : '👤',
      subject: message.subject || 'Patient message',
      preview: message.text,
      body: message.text,
      time: message.display_timestamp || new Date(message.created_at).toLocaleString(),
      unread: !message.read_by_provider,
      senderType: 'patient',
      createdAt: message.created_at,
    };
  });

  const outboundMessages = (outbound || []).map((message) => {
    const patient = message.to_user || {};
    const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.username || 'Patient';
    return {
      id: message.id,
      patientId: message.to_user_id,
      patientName,
      patientEmoji: patient.gender === 'Male' ? '👨' : patient.gender === 'Female' ? '👩' : '👤',
      subject: message.subject || 'Provider message',
      preview: message.text,
      body: message.text,
      time: message.display_timestamp || new Date(message.created_at).toLocaleString(),
      unread: false,
      senderType: 'provider',
      createdAt: message.created_at,
    };
  });

  res.json({ messages: [...inboundMessages, ...outboundMessages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
}));

providerRoutes.post('/messages', providerAuthRequired, asyncHandler(async (req, res) => {
  const patientId = req.body.patientId;
  const subject = String(req.body.subject || '').trim();
  const text = String(req.body.body || req.body.text || '').trim();
  if (!patientId || !subject || !text) return res.status(400).json({ error: 'patientId, subject, and body are required.' });
  if (!(await assertProviderPatient(req.provider.id, patientId))) return res.status(403).json({ error: 'You can only message connected patients.' });

  const { data, error } = await supabase
    .from('provider_messages')
    .insert({ provider_id: req.provider.id, to_user_id: patientId, subject, text, display_timestamp: new Date().toLocaleString() })
    .select('*, to_user:to_user_id(username, first_name, last_name, gender)')
    .single();
  if (error) throw error;

  await pushNotification({
    toUserId: patientId,
    fromProviderId: req.provider.id,
    type: 'provider_message',
    title: subject,
    message: `${providerDisplayName(req.providerRow)} sent you a message: ${subject}`,
  });

  const patient = data.to_user || {};
  const patientName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.username || 'Patient';
  res.status(201).json({
    message: {
      id: data.id,
      patientId: data.to_user_id,
      patientName,
      subject: data.subject,
      preview: data.text,
      body: data.text,
      time: data.display_timestamp,
      unread: false,
      senderType: 'provider',
      createdAt: data.created_at,
    },
  });
}));

providerRoutes.patch('/messages/:messageId/read', providerAuthRequired, asyncHandler(async (req, res) => {
  const { data: message, error: messageError } = await supabase.from('messages').select('*').eq('id', req.params.messageId).maybeSingle();
  if (messageError) throw messageError;
  if (!message || !(await assertProviderPatient(req.provider.id, message.from_user_id))) return res.status(404).json({ error: 'Message not found.' });
  const { error } = await supabase.from('messages').update({ read_by_provider: true }).eq('id', req.params.messageId);
  if (error) throw error;
  res.json({ success: true, id: req.params.messageId });
}));

providerRoutes.post('/messages/:messageId/reply', providerAuthRequired, asyncHandler(async (req, res) => {
  const text = String(req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Reply text is required.' });

  const { data: original, error: originalError } = await supabase.from('messages').select('*').eq('id', req.params.messageId).single();
  if (originalError || !original || !(await assertProviderPatient(req.provider.id, original.from_user_id))) return res.status(404).json({ error: 'Message not found.' });

  const { data, error } = await supabase
    .from('provider_messages')
    .insert({
      provider_id: req.provider.id,
      to_user_id: original.from_user_id,
      original_message_id: original.id,
      subject: `Re: ${original.subject || 'Patient message'}`,
      text,
      display_timestamp: new Date().toLocaleString(),
    })
    .select('*')
    .single();
  if (error) throw error;
  res.status(201).json({ success: true, id: req.params.messageId, reply: data });
}));

providerRoutes.patch('/messages/:messageId', providerAuthRequired, asyncHandler(async (req, res) => {
  const subject = String(req.body.subject || '').trim();
  const text = String(req.body.body || req.body.text || '').trim();
  if (!subject || !text) return res.status(400).json({ error: 'Subject and body are required.' });
  const { data, error } = await supabase
    .from('provider_messages')
    .update({ subject, text })
    .eq('id', req.params.messageId)
    .eq('provider_id', req.provider.id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Message not found.' });
  res.json({ success: true, message: data });
}));

providerRoutes.delete('/messages/:messageId', providerAuthRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('provider_messages')
    .delete()
    .eq('id', req.params.messageId)
    .eq('provider_id', req.provider.id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Message not found.' });
  res.json({ success: true, id: req.params.messageId });
}));
providerRoutes.get('/notifications', providerAuthRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('notifications').select('*').eq('to_provider_id', req.provider.id).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  res.json({ notifications: data.map(toProviderNotification) });
}));

providerRoutes.patch('/notifications/:notificationId/read', providerAuthRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', req.params.notificationId).eq('to_provider_id', req.provider.id);
  if (error) throw error;
  res.json({ success: true, id: req.params.notificationId });
}));

providerRoutes.patch('/notifications/read-all', providerAuthRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('to_provider_id', req.provider.id).eq('read', false);
  if (error) throw error;
  res.json({ success: true });
}));

async function getPatientWithLogs(providerId, patientId) {
  const connected = await assertProviderPatient(providerId, patientId);
  if (!connected) return { user: null, logs: [] };
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

