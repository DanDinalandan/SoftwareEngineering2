import { supabase } from '../supabase.js';
import { toProvider, toUser } from '../utils/mappers.js';
import { verifyToken } from '../services/tokens.js';

function bearerToken(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export async function authRequired(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Missing token.' });

  try {
    const payload = verifyToken(token);
    const { data, error } = await supabase.from('app_users').select('*').eq('id', payload.sub).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid token.' });
    req.userRow = data;
    req.user = toUser(data);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

export async function providerAuthRequired(req, res, next) {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: 'Missing token.' });

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'provider') return res.status(403).json({ error: 'Provider token required.' });
    const { data, error } = await supabase.from('providers').select('*').eq('id', payload.sub).single();
    if (error || !data) return res.status(401).json({ error: 'Invalid token.' });
    req.providerRow = data;
    req.provider = toProvider(data);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

