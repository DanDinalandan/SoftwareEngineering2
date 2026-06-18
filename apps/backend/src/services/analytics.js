import { config } from '../config.js';
import { supabase } from '../supabase.js';

const moodScore = { Awful: 1, Bad: 2, Okay: 3, Good: 4, Great: 5 };

function normalizeTrigger(trigger = '') {
  const value = String(trigger).toLowerCase();
  if (value.includes('stress') || value.includes('anxiety')) return 'stress';
  if (value.includes('social') || value.includes('pressure')) return 'social';
  if (value.includes('bored') || value.includes('habit')) return 'habit_boredom';
  if (value.includes('sad') || value.includes('emotion')) return 'emotion';
  if (value.includes('withdraw')) return 'withdrawal';
  return 'other';
}

function moodToClinicalTrigger(mood) {
  return ['Awful', 'Bad'].includes(mood) ? 'emotion' : null;
}

function rowPrimaryTrigger(row) {
  const scores = [
    ['stress', row.stress_anxiety_trigger],
    ['social', row.social_pressure_trigger],
    ['habit_boredom', row.main_relapse_reason === 'Habit/Boredom' ? 5 : 0],
    ['withdrawal', row.main_relapse_reason === 'Withdrawal Symptoms' ? 5 : 0],
    ['emotion', row.emotion_management],
  ];
  return scores.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0][0];
}

function countTriggers(logs) {
  const counts = {};
  logs.forEach((log) => {
    (log.triggers || []).forEach((trigger) => {
      const key = normalizeTrigger(trigger);
      counts[key] = (counts[key] || 0) + 1;
    });
    const moodTrigger = moodToClinicalTrigger(log.mood);
    if (moodTrigger) counts[moodTrigger] = (counts[moodTrigger] || 0) + 1;
  });
  return counts;
}

export function buildUserPattern(logs = []) {
  const triggerCounts = countTriggers(logs);
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([trigger, count]) => ({ trigger, count }));
  const avgCraving = logs.length
    ? logs.reduce((sum, log) => sum + Number(log.craving || 0), 0) / logs.length
    : 0;
  const avgMood = logs.length
    ? logs.reduce((sum, log) => sum + (moodScore[log.mood] || 3), 0) / logs.length
    : 3;
  const vapedDays = logs.filter((log) => log.vaped).length;
  const avgRisk = logs.length
    ? Math.round(logs.reduce((sum, log) => sum + Number(log.relapse_risk || log.relapseRisk || 0), 0) / logs.length)
    : 0;

  return {
    logCount: logs.length,
    topTriggers,
    avgCraving: Number(avgCraving.toFixed(1)),
    avgMood: Number(avgMood.toFixed(1)),
    vapedDays,
    vapeFreeDays: logs.length - vapedDays,
    avgRisk,
  };
}

export async function matchClinicalPatterns(logs = [], limit = 5) {
  const userPattern = buildUserPattern(logs);
  const { data, error } = await supabase
    .from('clinical_cessation_patterns')
    .select('*')
    .limit(1000);
  if (error) throw error;

  const top = userPattern.topTriggers[0]?.trigger || 'other';
  const scored = (data || []).map((row) => {
    let score = 0;
    if (rowPrimaryTrigger(row) === top) score += 35;
    score += Math.max(0, 25 - Math.abs(Number(row.craving_intensity || 0) - userPattern.avgCraving) * 5);
    if (row.early_relapse_history === (userPattern.vapedDays > 0 ? 'Yes' : 'No')) score += 15;
    if (row.main_relapse_reason && normalizeTrigger(row.main_relapse_reason) === top) score += 10;
    return { row, score };
  }).sort((a, b) => b.score - a.score).slice(0, limit);

  return {
    userPattern,
    matches: scored.map(({ row, score }) => ({
      id: row.id,
      score: Math.round(score),
      primaryTrigger: rowPrimaryTrigger(row),
      relapseReason: row.main_relapse_reason,
      cravingIntensity: row.craving_intensity,
      quitMotivation: row.quit_motivation,
      stressConfidence: row.stress_confidence,
    })),
  };
}

function fallbackRecommendation({ user, pattern, clinicalMatches, weeklyLogs }) {
  const top = pattern.topTriggers[0]?.trigger || 'cravings';
  const match = clinicalMatches[0];
  const recs = [];
  if (pattern.avgCraving >= 7) {
    recs.push('Your cravings are trending high. Plan a fast response for the first 10 minutes: water, movement, and messaging your support person.');
  }
  if (top === 'stress') recs.push('Stress is your strongest pattern. Use one repeatable stress script: pause, breathe for 60 seconds, leave the trigger area, then log the craving.');
  if (top === 'social') recs.push('Social pressure shows up in your data. Decide your refusal line before gatherings and keep a no-vape exit plan ready.');
  if (top === 'habit_boredom') recs.push('Habit or boredom is a common relapse reason in the clinical dataset. Replace the usual vape window with a short task that uses your hands.');
  if (pattern.vapedDays > 0) recs.push('A slip is data, not failure. Compare the time and trigger of the slip with tomorrow’s plan and make the next check-in easier.');
  if (match) recs.push(`Similar clinical records most often pointed to ${match.relapseReason}. Watch for that pattern this week.`);
  if (recs.length < 2) recs.push('Your week looks steady. Keep logging daily so the recommendations can become more personal.');
  return {
    title: 'Personalized Recommendation',
    summary: `${user.first_name || user.username}, your current pattern is ${top.replace('_', ' ')} with average craving ${pattern.avgCraving}/10.`,
    recommendations: recs.slice(0, 4),
    source: 'rules',
    weeklyReady: weeklyLogs.length >= 7,
  };
}

async function getPromptTemplate(key) {
  const { data, error } = await supabase
    .from('ai_prompt_templates')
    .select('*')
    .eq('template_key', key)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function callOpenAI(prompt) {
  if (!config.openaiApiKey) return null;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openaiModel,
      messages: [
        { role: 'system', content: 'You create concise, supportive vape cessation recommendations. Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function buildRecommendations({ user, logs, type = 'dashboard' }) {
  const recentLogs = logs.slice(0, type === 'weekly_report' ? 7 : 20);
  const { userPattern, matches } = await matchClinicalPatterns(logs.slice(0, 20));
  const template = await getPromptTemplate(type);
  const payload = {
    user: { firstName: user.first_name, streak: user.streak, goal: user.goal },
    pattern: userPattern,
    clinicalMatches: matches,
    recentLogs: recentLogs.map((log) => ({
      date: log.log_date,
      mood: log.mood,
      triggers: log.triggers,
      craving: log.craving,
      vaped: log.vaped,
      relapseRisk: log.relapse_risk,
      comment: log.comment,
    })),
    constraints: {
      weeklyReportRequiresSevenDays: type === 'weekly_report',
      compareUpToTwentyLogs: true,
    },
  };

  let result = null;
  if (template?.prompt) {
    const prompt = template.prompt.replace('{{payload}}', JSON.stringify(payload, null, 2));
    result = await callOpenAI(prompt);
  }

  if (!result) {
    result = fallbackRecommendation({
      user,
      pattern: userPattern,
      clinicalMatches: matches,
      weeklyLogs: logs.slice(0, 7),
    });
  }

  const { data, error } = await supabase
    .from('ai_recommendations')
    .insert({
      user_id: user.id,
      recommendation_type: type,
      prompt_template_id: template?.id || null,
      clinical_match_ids: matches.map((match) => match.id),
      source: result.source || (config.openaiApiKey ? 'openai' : 'rules'),
      payload,
      response: result,
    })
    .select('*')
    .single();
  if (error) throw error;
  return { ...result, id: data.id, pattern: userPattern, clinicalMatches: matches };
}

export async function getDailyQuote(userId, localDate) {
  const { data: existing, error: existingError } = await supabase
    .from('user_daily_quotes')
    .select('quote:motivational_quotes(*)')
    .eq('user_id', userId)
    .eq('quote_date', localDate)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.quote) return existing.quote;

  const { count, error: countError } = await supabase
    .from('motivational_quotes')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);
  if (countError) throw countError;

  const safeCount = count || 1;
  const indexSeed = Array.from(`${userId}-${localDate}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const from = indexSeed % safeCount;
  const { data: quoteRows, error: quoteError } = await supabase
    .from('motivational_quotes')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true })
    .range(from, from);
  if (quoteError) throw quoteError;
  const quote = quoteRows?.[0];
  if (!quote) return null;

  await supabase
    .from('user_daily_quotes')
    .upsert({ user_id: userId, quote_id: quote.id, quote_date: localDate }, { onConflict: 'user_id,quote_date' });
  return quote;
}

export function buildTopTriggers(logs = []) {
  return buildUserPattern(logs).topTriggers.slice(0, 3).map((item) => ({
    trigger: item.trigger.replace('_', ' '),
    count: item.count,
  }));
}
