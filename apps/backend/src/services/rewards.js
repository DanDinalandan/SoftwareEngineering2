import { supabase } from '../supabase.js';

function evaluateCriteria(criteria, stats) {
  const target = Number(criteria?.target || 0);
  switch (criteria?.type) {
    case 'log_count':
      return Math.min(stats.daysLogged, target);
    case 'streak':
      return Math.min(stats.streak, target);
    case 'goal_set':
      return stats.hasGoal ? target : 0;
    case 'peer_connected':
      return stats.hasPeer ? target : 0;
    default:
      return 0;
  }
}

function toRewardGoal(row, status) {
  const target = Number(row.criteria?.target || row.points_required || 1);
  const progress = Math.min(target, Number(status?.progress || 0));
  const unlocked = Boolean(status?.unlocked || progress >= target);
  return {
    id: row.id,
    name: row.name,
    desc: row.description,
    icon: row.icon_key,
    pts: row.points_required,
    criteria: row.criteria,
    progress,
    target,
    progressPercent: target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 100,
    unlocked,
    unlockedAt: status?.unlocked_at || null,
  };
}

export async function syncRewardsForUser(userId) {
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .single();
  if (userError || !user) throw userError || new Error('User not found.');

  const { count, error: countError } = await supabase
    .from('mood_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (countError) throw countError;

  const stats = {
    daysLogged: Number(user.days_logged ?? count ?? 0),
    streak: Number(user.streak || 0),
    hasGoal: Boolean(user.goal),
    hasPeer: Boolean(user.connected_peer_user_id),
  };

  const { data: goals, error: goalsError } = await supabase
    .from('reward_goals')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });
  if (goalsError) throw goalsError;

  const { data: existingRows, error: existingError } = await supabase
    .from('user_reward_goals')
    .select('*')
    .eq('user_id', userId);
  if (existingError) throw existingError;

  const existing = new Map((existingRows || []).map((row) => [row.reward_goal_id, row]));
  const now = new Date().toISOString();
  const upserts = [];
  const newlyUnlocked = [];

  for (const goal of goals || []) {
    const previous = existing.get(goal.id);
    const target = Number(goal.criteria?.target || goal.points_required || 1);
    const progress = evaluateCriteria(goal.criteria, stats);
    const unlocked = Boolean(previous?.unlocked || progress >= target);
    const unlockedAt = previous?.unlocked_at || (unlocked ? now : null);

    upserts.push({
      user_id: userId,
      reward_goal_id: goal.id,
      progress,
      unlocked,
      unlocked_at: unlockedAt,
      updated_at: now,
    });

    if (unlocked && !previous?.unlocked) {
      newlyUnlocked.push(toRewardGoal(goal, { progress, unlocked, unlocked_at: unlockedAt }));
    }
  }

  if (upserts.length > 0) {
    const { error: upsertError } = await supabase
      .from('user_reward_goals')
      .upsert(upserts, { onConflict: 'user_id,reward_goal_id' });
    if (upsertError) throw upsertError;
  }

  const unlockedRewardIds = upserts.filter((row) => row.unlocked).map((row) => row.reward_goal_id);
  const bonusPoints = newlyUnlocked.reduce((sum, reward) => sum + Number(reward.pts || 0), 0);
  const userUpdate = { unlocked_rewards: unlockedRewardIds, updated_at: now };
  if (bonusPoints > 0) userUpdate.total_points = Number(user.total_points || 0) + bonusPoints;

  const { error: updateError } = await supabase
    .from('app_users')
    .update(userUpdate)
    .eq('id', userId);
  if (updateError) throw updateError;

  return {
    rewards: (goals || []).map((goal) => {
      const synced = upserts.find((row) => row.reward_goal_id === goal.id);
      return toRewardGoal(goal, synced);
    }),
    newlyUnlocked,
    unlockedRewardIds,
  };
}
