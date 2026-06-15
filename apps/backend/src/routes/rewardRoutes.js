import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { syncRewardsForUser } from '../services/rewards.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const rewardRoutes = Router();

rewardRoutes.get('/rewards', authRequired, asyncHandler(async (req, res) => {
  if (req.user.role !== 'Vape User') return res.json({ rewards: [], newlyUnlocked: [] });
  const result = await syncRewardsForUser(req.user.id);
  res.json(result);
}));
