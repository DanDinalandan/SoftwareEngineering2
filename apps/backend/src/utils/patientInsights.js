const moodRiskScores = { Great: 0, Good: 10, Okay: 30, Bad: 60, Awful: 80 };

export function moodEmoji(mood) {
  return {
    Awful: '😫',
    Bad: '🙁',
    Okay: '😐',
    Good: '🙂',
    Great: '😄',
  }[mood] || '😐';
}

export function calculateRelapseRisk({ mood, craving, triggers }) {
  const moodRisk = moodRiskScores[mood] ?? 30;
  const cravingRisk = (Number(craving) / 10) * 100;
  const triggerRisk = Math.min((triggers || []).length * 15, 60);
  return Math.min(100, Math.round(cravingRisk * 0.5 + moodRisk * 0.3 + triggerRisk * 0.2));
}

export function riskLevel(score) {
  return score >= 70 ? 'High Risk' : score >= 40 ? 'Moderate' : 'Low-Moderate';
}

export function statusFromRisk(score) {
  return score >= 70 ? 'alert' : score >= 40 ? 'monitor' : 'stable';
}

export function patientFromUser(user, latestLog) {
  const score = latestLog?.relapse_risk ?? user.last_relapse_risk ?? 0;
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
    status: statusFromRisk(score),
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

export function buildPatientInsights(user, logs) {
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
      return { trigger, width, level: width >= 70 ? 'high' : width >= 40 ? 'mid' : 'low', freq: `${count}x/wk` };
    });

  if (!correlation.length) correlation.push({ trigger: latest?.triggers?.[0] || 'None', width: 10, level: 'low', freq: '0x/wk' });

  const moodWeek = buildSeries(
    logs,
    7,
    (log, index) => ({ emoji: moodEmoji(log.mood), label: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'][index] }),
    (_index, day) => ({ emoji: moodEmoji('Okay'), label: day })
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

