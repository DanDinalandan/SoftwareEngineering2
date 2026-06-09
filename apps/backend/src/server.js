import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { assertConfig, config } from './config.js';
import { supabase } from './supabase.js';

assertConfig();

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl === '*' ? true : config.clientUrl }));
app.use(express.json());

const moodRiskScores = { Great: 0, Good: 10, Okay: 30, Bad: 60, Awful: 80 };

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, type: 'user' }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function signProviderToken(provider) {
  return jwt.sign({ sub: provider.id, type: 'provider' }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    middleName: row.middle_name || '',
    suffix: row.suffix || '',
    birthday: row.birthday || '',
    age: row.age ?? '',
    gender: row.gender || '',
    phone: row.phone || '',
    streak: row.streak || 0,
    totalPoints: row.total_points || 0,
    lastRelapseRisk: row.last_relapse_risk || 0,
    profileComplete: row.profile_complete || false,
    connectedPeerUserId: row.connected_peer_user_id,
    connectedVapeUserId: row.connected_vape_user_id,
    connectedPeerUsername: row.connected_peer_username,
    connectedVapeUserUsername: row.connected_vape_user_username,
    peerRelationship: row.peer_relationship,
    progressSharedWithPeer: row.progress_shared_with_peer || false,
    vapeUserRelationshipLabel: row.vape_user_relationship_label,
    vapeTypes: row.vape_types || [],
    goal: row.goal,
    twoFAEnabled: row.two_fa_enabled || false,
    unlockedRewards: row.unlocked_rewards || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProvider(row) {
  if (!row) return null;
  const name = `${row.first_name || ''} ${row.last_name || ''}`.trim();
  return {
    id: row.id,
    name,
    email: row.email,
    license: row.license,
    department: row.department || '',
    phone: row.phone || '',
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    middleName: row.middle_name || '',
    suffix: row.suffix || '',
    gender: row.gender || '',
    dob: row.dob,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMoodLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.log_date,
    mood: row.mood,
    triggers: row.triggers || [],
    craving: row.craving,
    vaped: row.vaped,
    puffsToday: row.puffs_today || 0,
    vapedHour: row.vaped_hour,
    comment: row.comment || '',
    relapseRisk: row.relapse_risk,
    points: row.points,
    timestamp: row.display_timestamp,
    createdAt: row.created_at,
  };
}

function moodEmoji(mood) {
  return {
    Awful: '😫',
    Bad: '🙁',
    Okay: '😐',
    Good: '🙂',
    Great: '😄',
  }[mood] || '😐';
}

function riskLevel(score) {
  return score >= 70 ? 'High Risk' : score >= 40 ? 'Moderate' : 'Low-Moderate';
}

function statusFromRisk(score) {
  return score >= 70 ? 'alert' : score >= 40 ? 'monitor' : 'stable';
}

function patientFromUser(user, latestLog) {
  const score = latestLog?.relapse_risk ?? user.last_relapse_risk ?? 0;
  const status = statusFromRisk(score);
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  const mood = latestLog?.mood || 'Okay';
  const trigger = latestLog?.triggers?.[0] || 'None';

  return {
    id: user.id,
    name: fullName,
    email: user.email,
    emoji: user.gender === 'Male' ? '👨' : user.gender === 'Female' ? '👩' : '👤',
    age: user.age || '',
    sex: user.gender === 'Male' ? 'M' : user.gender === 'Female' ? 'F' : '',
    day: user.streak || 0,
    streak: user.streak || 0,
    streakLabel: user.streak > 0 ? `${user.streak} days` : 'New',
    lastMood: `${moodEmoji(mood)} ${mood}`,
    todaysMood: mood,
    topTrigger: trigger,
    triggerLevel: score >= 70 ? 'high' : 'normal',
    riskScore: score,
    riskColor: score >= 70 ? 'var(--red)' : score >= 40 ? 'var(--amber)' : 'var(--green)',
    status,
  };
}

function buildSeries(logs, count, mapper, fallback) {
  const days = ['M', 'T', 'W', 'TH', 'F', 'S', 'SU'];
  const recent = [...logs].slice(0, count).reverse();
  return Array.from({ length: count }, (_, index) => {
    const log = recent[index];
    return log ? mapper(log, index) : fallback(index, days[index % 7]);
  });
}

function buildPatientInsights(user, logs) {
  const latest = logs[0];
  const score = latest?.relapse_risk ?? user.last_relapse_risk ?? 0;
  const triggerCounts = {};
  logs.forEach((log) => (log.triggers || []).forEach((trigger) => {
    triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
  }));

  const correlation = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([trigger, count]) => {
      const width = Math.min(100, Math.max(10, count * 20));
      return {
        trigger,
        width,
        level: width >= 70 ? 'high' : width >= 40 ? 'mid' : 'low',
        freq: `${count}x/wk`,
      };
    });

  if (correlation.length === 0) {
    correlation.push({ trigger: latest?.triggers?.[0] || 'None', width: 10, level: 'low', freq: '0x/wk' });
  }

  const moodWeek = buildSeries(
    logs,
    7,
    (log, index) => ({ emoji: moodEmoji(log.mood), label: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][index] }),
    (_index, day) => ({ emoji: '😐', label: day })
  );
  const sparkline = buildSeries(
    logs,
    7,
    (log) => ({ height: Math.max(8, log.craving * 8), level: log.craving >= 7 ? 'high' : log.craving >= 4 ? 'mid' : 'low' }),
    () => ({ height: 12, level: 'low' })
  );
  const streaks = buildSeries(
    logs,
    14,
    (log, index) => ({ label: ['M', 'T', 'W', 'TH', 'F', 'S', 'SU'][index % 7], height: Math.max(10, log.relapse_risk), level: log.relapse_risk >= 70 ? 'high' : log.relapse_risk >= 40 ? 'mid' : 'low' }),
    (_index, day) => ({ label: day, height: 10, level: 'low' })
  );

  const milestones = [7, 14, 30, 60, 90].map((days) => ({
    label: `${days} days`,
    sub: user.streak >= days ? 'Achieved' : `${Math.max(0, days - (user.streak || 0))} days left`,
    done: (user.streak || 0) >= days,
  }));

  const avgMoodMap = { Awful: 1, Bad: 2, Okay: 3, Good: 4, Great: 5 };
  const last7 = logs.slice(0, 7);
  const avgMood = last7.length
    ? (last7.reduce((sum, log) => sum + (avgMoodMap[log.mood] || 3), 0) / last7.length).toFixed(1)
    : '3.0';

  return {
    riskScore: score,
    riskLevel: riskLevel(score),
    streakDays: user.streak || 0,
    avgMood,
    adherence: last7.length >= 7 ? '100%' : `${Math.round((last7.length / 7) * 100)}%`,
    cravingLevel: latest ? latest.craving * 10 : 0,
    correlation,
    streaks,
    moodWeek,
    sparkline,
    milestones,
    bestMoodDay: last7.find((log) => ['Great', 'Good'].includes(log.mood))?.log_date || 'None recorded',
    worstCravingDay: last7.slice().sort((a, b) => b.craving - a.craving)[0]?.log_date || 'None recorded',
    highestRiskDay: last7.slice().sort((a, b) => b.relapse_risk - a.relapse_risk)[0]?.log_date || 'None recorded',
    lastRelapse: logs.find((log) => log.vaped)?.log_date || 'None recorded',
  };
}

function calculateRelapseRisk({ mood, craving, triggers }) {
  const moodRisk = moodRiskScores[mood] ?? 30;
  const cravingRisk = (Number(craving) / 10) * 100;
  const triggerRisk = Math.min((triggers || []).length * 15, 60);
  return Math.min(100, Math.round(cravingRisk * 0.5 + moodRisk * 0.3 + triggerRisk * 0.2));
}

function calculateAge(birthday) {
  if (!birthday) return null;
  const [month, day, year] = String(birthday).split('/').map(Number);
  if (!month || !day || !year) return null;
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function mapDbError(error) {
  if (!error) return null;
  if (error.code === '23505') return { status: 409, message: 'Email or username is already taken.' };
  return { status: 500, message: error.message || 'Database error.' };
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

async function authRequired(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token.' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !data) return res.status(401).json({ error: 'Invalid token.' });
    req.userRow = data;
    req.user = toUser(data);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

async function providerAuthRequired(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token.' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.type !== 'provider') return res.status(403).json({ error: 'Provider token required.' });
    const { data, error } = await supabase
      .from('providers')
      .select('*')
      .eq('id', payload.sub)
      .single();

    if (error || !data) return res.status(401).json({ error: 'Invalid token.' });
    req.providerRow = data;
    req.provider = toProvider(data);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

async function findUserByUsername(username) {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('username', String(username || '').trim().toLowerCase())
    .single();

  if (error) return null;
  return data;
}

async function pushNotification(payload) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      to_user_id: payload.toUserId,
      type: payload.type,
      message: payload.message,
      request_id: payload.requestId || null,
      from_user_id: payload.fromUserId || null,
      from_display_name: payload.fromDisplayName || null,
      display_timestamp: new Date().toLocaleTimeString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/register', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = req.body.role || '';

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required.' });
  }
  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const { data, error } = await supabase
    .from('app_users')
    .insert({
      email,
      username,
      password_hash: passwordHash,
      role,
      phone: req.body.phone || '',
    })
    .select('*')
    .single();

  if (error) {
    const mapped = mapDbError(error);
    return res.status(mapped.status).json({ error: mapped.message });
  }

  const user = toUser(data);
  res.status(201).json({ token: signToken(user), user });
}));

app.post('/provider/register', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const license = String(req.body.license || '').trim();

  if (!email || !password || !license || !req.body.firstName || !req.body.lastName) {
    return res.status(400).json({ error: 'Email, password, license, firstName, and lastName are required.' });
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const { data, error } = await supabase
    .from('providers')
    .insert({
      email,
      password_hash: passwordHash,
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

app.post('/provider/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) return res.status(401).json({ error: 'Invalid credentials. Please check and try again.' });
  if (!(await bcrypt.compare(password, data.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials. Please check and try again.' });
  }

  const provider = toProvider(data);
  res.json({ token: signProviderToken(provider), provider });
}));

app.get('/provider/me', providerAuthRequired, (req, res) => {
  res.json({ provider: req.provider });
});

app.get('/provider/patients', providerAuthRequired, asyncHandler(async (_req, res) => {
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

app.get('/provider/patients/:patientId/dashboard', providerAuthRequired, asyncHandler(async (req, res) => {
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', req.params.patientId)
    .eq('role', 'Vape User')
    .single();
  if (userError || !user) return res.status(404).json({ error: 'Patient not found.' });

  const { data: logs, error: logsError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false });
  if (logsError) throw logsError;

  const latest = logs[0];
  const info = patientFromUser(user, latest);
  const insights = buildPatientInsights(user, logs);
  res.json({
    info,
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

app.get('/provider/patients/:patientId/profile', providerAuthRequired, asyncHandler(async (req, res) => {
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', req.params.patientId)
    .eq('role', 'Vape User')
    .single();
  if (userError || !user) return res.status(404).json({ error: 'Patient not found.' });

  const { data: logs, error: logsError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false });
  if (logsError) throw logsError;

  res.json({ info: patientFromUser(user, logs[0]), insights: buildPatientInsights(user, logs) });
}));

app.get('/provider/messages', providerAuthRequired, asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*, from_user:from_user_id(username, first_name, last_name), to_user:to_user_id(username, first_name, last_name)')
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
        patientEmoji: '👤',
        subject: 'Patient message',
        preview: message.text,
        body: message.text,
        time: message.display_timestamp || new Date(message.created_at).toLocaleString(),
        unread: false,
      };
    }),
  });
}));

app.post('/auth/login', asyncHandler(async (req, res) => {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .or(`email.eq.${identifier},username.eq.${identifier}`)
    .single();

  if (error || !data) return res.status(401).json({ error: 'Invalid credentials. Please check and try again.' });
  const matches = await bcrypt.compare(password, data.password_hash);
  if (!matches) return res.status(401).json({ error: 'Invalid credentials. Please check and try again.' });
  if (req.body.role && data.role && req.body.role !== data.role) {
    return res.status(403).json({ error: 'Role mismatch.' });
  }

  const user = toUser(data);
  res.json({ token: signToken(user), user });
}));

app.get('/auth/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.patch('/user/profile', authRequired, asyncHandler(async (req, res) => {
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

  const { data, error } = await supabase
    .from('app_users')
    .update(update)
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json({ user: toUser(data) });
}));

app.put('/user/role', authRequired, asyncHandler(async (req, res) => {
  if (!['Vape User', 'Peer'].includes(req.body.role)) {
    return res.status(400).json({ error: 'Role must be Vape User or Peer.' });
  }

  const { data, error } = await supabase
    .from('app_users')
    .update({ role: req.body.role, updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json({ user: toUser(data) });
}));

app.put('/user/goal', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('app_users')
    .update({ goal: req.body, updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json({ user: toUser(data) });
}));

app.patch('/user/phone', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('app_users')
    .update({ phone: req.body.phone || '', updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json({ user: toUser(data) });
}));

app.post('/mood', authRequired, asyncHandler(async (req, res) => {
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
    .update({
      streak: newStreak,
      total_points: req.user.totalPoints + pointsEarned,
      last_relapse_risk: relapseRisk,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (updateError) throw updateError;

  if (updatedUser.connected_peer_user_id && updatedUser.progress_shared_with_peer) {
    const displayName = updatedUser.first_name || updatedUser.username;
    if (relapseRisk > 60 || ['Awful', 'Bad'].includes(req.body.mood)) {
      await pushNotification({
        toUserId: updatedUser.connected_peer_user_id,
        type: 'high_risk',
        message: `${displayName} logged ${String(req.body.mood).toLowerCase()} mood with ${relapseRisk}% relapse risk. They may need support.`,
      });
    }
    if (vaped) {
      await pushNotification({
        toUserId: updatedUser.connected_peer_user_id,
        type: 'vaped',
        message: `${displayName} reported vaping today. Consider reaching out.`,
      });
    }
  }

  res.status(201).json({
    entry: toMoodLog(entry),
    pointsEarned,
    newStreak,
    relapseRisk,
  });
}));

app.get('/mood', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('log_date', { ascending: false });

  if (error) throw error;
  res.json({ moodLogs: data.map(toMoodLog) });
}));

app.delete('/mood/:id', authRequired, asyncHandler(async (req, res) => {
  const { data: entry, error: getError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (getError || !entry) return res.status(404).json({ error: 'Mood log not found.' });

  const { error: deleteError } = await supabase
    .from('mood_logs')
    .delete()
    .eq('id', entry.id);

  if (deleteError) throw deleteError;

  const pointsReversed = entry.points || 0;
  const newStreak = !entry.vaped && req.user.streak > 0 ? req.user.streak - 1 : req.user.streak;
  const { data: updatedUser, error: updateError } = await supabase
    .from('app_users')
    .update({
      streak: newStreak,
      total_points: Math.max(0, req.user.totalPoints - pointsReversed),
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (updateError) throw updateError;
  res.json({ message: 'Log deleted', pointsReversed, newStreak: updatedUser.streak });
}));

app.post('/connections/request', authRequired, asyncHandler(async (req, res) => {
  const target = await findUserByUsername(req.body.toUsername);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  if (req.user.role === 'Peer' && target.role !== 'Vape User') {
    return res.status(400).json({ error: 'You can only connect to Vape Users.' });
  }
  if (req.user.role === 'Vape User' && target.role !== 'Peer') {
    return res.status(400).json({ error: 'You can only connect to Peer Supporters.' });
  }

  if (req.user.connectedPeerUserId || req.user.connectedVapeUserId || target.connected_peer_user_id || target.connected_vape_user_id) {
    return res.status(409).json({ error: 'One of these users is already connected.' });
  }

  const { data: existing } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('from_user_id', req.user.id)
    .eq('to_user_id', target.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) return res.status(409).json({ error: 'Request already sent.' });

  const { data: request, error } = await supabase
    .from('connection_requests')
    .insert({ from_user_id: req.user.id, to_user_id: target.id })
    .select('*')
    .single();

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

app.patch('/connections/:requestId', authRequired, asyncHandler(async (req, res) => {
  const { data: request, error: requestError } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('id', req.params.requestId)
    .eq('to_user_id', req.user.id)
    .single();

  if (requestError || !request) return res.status(404).json({ error: 'Request not found.' });
  if (request.status !== 'pending') return res.status(409).json({ error: 'Request is already resolved.' });

  const accept = Boolean(req.body.accept);
  const { error: statusError } = await supabase
    .from('connection_requests')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', request.id);

  if (statusError) throw statusError;

  if (!accept) {
    await pushNotification({
      toUserId: request.from_user_id,
      fromUserId: req.user.id,
      type: 'connection_rejected',
      message: `${req.user.firstName || req.user.username} declined your connection request.`,
    });
    return res.json({ accepted: false });
  }

  const { data: fromUser, error: fromError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', request.from_user_id)
    .single();

  if (fromError) throw fromError;

  const peer = fromUser.role === 'Peer' ? fromUser : req.userRow;
  const vapeUser = fromUser.role === 'Vape User' ? fromUser : req.userRow;

  const updates = [
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
  ];

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed) throw failed.error;

  await pushNotification({
    toUserId: peer.id,
    fromUserId: vapeUser.id,
    type: 'connection_accepted',
    message: `${vapeUser.first_name || vapeUser.username} accepted your connection request! You are now their peer supporter.`,
  });

  res.json({ accepted: true });
}));

app.delete('/connections', authRequired, asyncHandler(async (req, res) => {
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

app.get('/connections/peer-user', authRequired, asyncHandler(async (req, res) => {
  if (req.user.role !== 'Peer') return res.status(403).json({ error: 'Peer only.' });
  if (!req.user.connectedVapeUserId) return res.status(404).json({ error: 'No connected vape user.' });

  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', req.user.connectedVapeUserId)
    .single();
  if (userError) throw userError;

  const { data: moodLogs, error: moodError } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('log_date', { ascending: false });
  if (moodError) throw moodError;

  res.json({ user: toUser(user), moodLogs: moodLogs.map(toMoodLog), lastRelapseRisk: user.last_relapse_risk });
}));

app.get('/connections/pending', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*, from_user:from_user_id(username, first_name, last_name, role)')
    .eq('to_user_id', req.user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json({ requests: data });
}));

app.get('/messages/:withUserId', authRequired, asyncHandler(async (req, res) => {
  const withUserId = req.params.withUserId;
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(from_user_id.eq.${req.user.id},to_user_id.eq.${withUserId}),and(from_user_id.eq.${withUserId},to_user_id.eq.${req.user.id})`)
    .order('created_at', { ascending: true });

  if (error) throw error;
  res.json({ messages: data });
}));

app.post('/messages', authRequired, asyncHandler(async (req, res) => {
  if (!req.body.toUserId || !String(req.body.text || '').trim()) {
    return res.status(400).json({ error: 'toUserId and text are required.' });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      from_user_id: req.user.id,
      to_user_id: req.body.toUserId,
      text: String(req.body.text).trim(),
      display_timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
    .select('*')
    .single();

  if (error) throw error;
  res.status(201).json({ message: data });
}));

app.get('/notifications', authRequired, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('to_user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  res.json({ notifications: data });
}));

app.patch('/notifications/read-all', authRequired, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('to_user_id', req.user.id);

  if (error) throw error;
  res.json({ read: true });
}));

app.post('/auth/send-otp', authRequired, asyncHandler(async (req, res) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('otp_codes')
    .insert({
      user_id: req.user.id,
      phone: req.body.phone || req.user.phone,
      code_hash: await bcrypt.hash(otp, config.bcryptRounds),
      expires_at: expiresAt,
    });

  if (error) throw error;

  res.json({
    message: 'OTP generated. Wire this endpoint to an SMS provider before production.',
    devOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
  });
}));

app.post('/auth/verify-otp', authRequired, asyncHandler(async (req, res) => {
  const { data: codes, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('user_id', req.user.id)
    .is('consumed_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  const code = codes?.[0];
  if (!code || !(await bcrypt.compare(String(req.body.otp || ''), code.code_hash))) {
    return res.status(400).json({ error: 'Invalid or expired OTP.' });
  }

  await supabase.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', code.id);
  const { data: user, error: updateError } = await supabase
    .from('app_users')
    .update({ two_fa_enabled: true, phone: code.phone, updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (updateError) throw updateError;
  res.json({ message: '2FA enabled', twoFAEnabled: true, user: toUser(user) });
}));

app.delete('/auth/2fa', authRequired, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('app_users')
    .update({ two_fa_enabled: false, updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();

  if (error) throw error;
  res.json({ twoFAEnabled: false, user: toUser(user) });
}));

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.message || 'Internal server error.' });
});

app.listen(config.port, () => {
  console.log(`Unvapeify API running on http://localhost:${config.port}`);
});
