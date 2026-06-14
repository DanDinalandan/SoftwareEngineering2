import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { config } from '../config.js';
import { supabase } from '../supabase.js';
import { authRequired } from '../middleware/auth.js';
import { signToken } from '../services/tokens.js';
import { toUser } from '../utils/mappers.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { mapDbError } from '../utils/userFields.js';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const role = req.body.role || '';

  if (!email || !username || !password) return res.status(400).json({ error: 'Email, username, and password are required.' });
  if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });

  const { data, error } = await supabase
    .from('app_users')
    .insert({ email, username, password_hash: await bcrypt.hash(password, config.bcryptRounds), role, phone: req.body.phone || '' })
    .select('*')
    .single();

  if (error) {
    const mapped = mapDbError(error);
    return res.status(mapped.status).json({ error: mapped.message });
  }

  const user = toUser(data);
  res.status(201).json({ token: signToken(user), user });
}));

authRoutes.post('/login', asyncHandler(async (req, res) => {
  const identifier = String(req.body.identifier || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const { data, error } = await supabase.from('app_users').select('*').or(`email.eq.${identifier},username.eq.${identifier}`).single();

  if (error || !data || !(await bcrypt.compare(password, data.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials. Please check and try again.' });
  }
  if (req.body.role && data.role && req.body.role !== data.role) return res.status(403).json({ error: 'Role mismatch.' });

  const user = toUser(data);
  res.json({ token: signToken(user), user });
}));

authRoutes.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

authRoutes.post('/send-otp', authRequired, asyncHandler(async (req, res) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await supabase.from('otp_codes').insert({
    user_id: req.user.id,
    phone: req.body.phone || req.user.phone,
    code_hash: await bcrypt.hash(otp, config.bcryptRounds),
    expires_at: expiresAt,
  });
  if (error) throw error;
  res.json({ message: 'OTP generated. Wire this endpoint to an SMS provider before production.', devOtp: process.env.NODE_ENV === 'production' ? undefined : otp });
}));

authRoutes.post('/verify-otp', authRequired, asyncHandler(async (req, res) => {
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
  if (!code || !(await bcrypt.compare(String(req.body.otp || ''), code.code_hash))) return res.status(400).json({ error: 'Invalid or expired OTP.' });

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

authRoutes.delete('/2fa', authRequired, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabase
    .from('app_users')
    .update({ two_fa_enabled: false, updated_at: new Date().toISOString() })
    .eq('id', req.user.id)
    .select('*')
    .single();
  if (error) throw error;
  res.json({ twoFAEnabled: false, user: toUser(user) });
}));

