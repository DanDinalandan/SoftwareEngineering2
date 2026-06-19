import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { TIME_SLOTS, DURATIONS, VAPE_DEVICES } from '../data/displayOptions.js'

function calculateVapingPatterns(logs) {
  const relapseLogs = logs.filter(l => l.vapedToday === 'Yes' && l.vapedSessions?.length > 0);
  if (relapseLogs.length === 0) return null;

  const timeSlots = {};
  const devices = {};
  let totalDurationMins = 0;
  let totalSessions = 0;

  relapseLogs.forEach(log => {
    log.vapedSessions.forEach(session => {
      if (session.timeSlotId) timeSlots[session.timeSlotId] = (timeSlots[session.timeSlotId] || 0) + 1;
      if (session.deviceId) devices[session.deviceId] = (devices[session.deviceId] || 0) + 1;
      
      const durObj = DURATIONS.find(d => d.id === session.durationId);
      if (durObj) totalDurationMins += durObj.minutes;
      
      totalSessions++;
    });
  });

  const topTimeId = Object.keys(timeSlots).sort((a, b) => timeSlots[b] - timeSlots[a])[0];
  const topDevId  = Object.keys(devices).sort((a, b) => devices[b] - devices[a])[0];

  return {
    topTimeSlot: TIME_SLOTS.find(t => t.id === topTimeId)?.label || 'Unknown',
    topDevice: VAPE_DEVICES.find(v => v.id === topDevId)?.label || 'Unknown',
    avgDuration: totalSessions > 0 ? `${Math.round(totalDurationMins / totalSessions)} min` : 'Unknown',
    avgSessionsPerRelapseDay: (totalSessions / relapseLogs.length).toFixed(1)
  };
}

function InsightsSeparator({ label }) {
  return (
    <div className="insights-sep">
      <span className="insights-sep-label">{label}</span>
      <div className="insights-line" />
    </div>
  )
}

function StatBox({ label, value, valueColor, subText, delta, deltaType }) {
  return (
    <div className="stat-box">
      <div className="section-label">{label}</div>
      <div className="stat-val" style={valueColor ? { color: valueColor } : {}}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subText}</div>
      <div className={deltaType === 'up' ? 'delta-up' : 'delta-down'}>{delta}</div>
    </div>
  )
}

function RiskScoreCard({ score, level, topTrigger, highestRiskDay, lastRelapse }) {
  const dotPosition = `${Math.max(5, Math.min(score, 95))}%`
  const tiles = [
    { label: 'Primary trigger',  value: topTrigger,                                                     color: null },
    { label: 'Risk trajectory',  value: score > 50 ? '↑ Rising' : '↓ Stable decline',                  color: score > 50 ? 'var(--red)' : 'var(--green)' },
    { label: 'Highest-risk day', value: highestRiskDay,                                                  color: null },
    { label: 'Last relapse',     value: lastRelapse, color: lastRelapse !== 'None recorded' ? 'var(--red)' : 'var(--green)' },
  ]
  return (
    <div className="card">
      <div className="card-header">
        <div className="section-label" style={{ margin: 0 }}>Relapse Risk Score</div>
        <span className="risk-badge">{score} / 100</span>
      </div>
      <div className="risk-val" style={{ color: score >= 70 ? 'var(--red)' : score >= 40 ? 'var(--amber)' : 'var(--green)' }}>
        {level}
      </div>
      <div style={{ position: 'relative' }}>
        <div className="gradient-bar">
          <div className="bar-indicator" style={{ left: dotPosition }} />
        </div>
        <div className="slider-labels">
          <span>Safe</span><span>Moderate</span><span>High</span>
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tiles.map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--bg-tag)', borderRadius: 12, padding: 12 }}>
            <div className="section-label" style={{ marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: color || 'inherit' }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CorrelationCard({ correlationList }) {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 16 }}>Mood–Trigger Correlation</div>
      <div className="matrix-table">
        <div className="matrix-row matrix-th">
          <span>Trigger</span>
          <span style={{ textAlign: 'center' }}>Correlation to low mood</span>
          <span style={{ textAlign: 'right' }}>Score</span>
          <span style={{ textAlign: 'right' }}>Freq</span>
        </div>
        {correlationList.map(({ trigger, width, level, freq }) => (
          <div key={trigger} className="matrix-row">
            <span>{trigger}</span>
            <div>
              <div className="matrix-bar-bg">
                <div className={`matrix-bar-fill bar-${level}`} style={{ width: `${width}%` }} />
              </div>
            </div>
            <span className="text-muted">{width}%</span>
            <span className="text-muted">{freq}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StreakChart({ streakData }) {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 20 }}>Streak Progress — 14 Days</div>
      <div className="chart-axis">
        {streakData.map(({ label, height, level }, index) => (
          <div key={index} className="bar-node">
            <div className={`chart-bar bar-${level}`} style={{ height }} />
            <span className="axis-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        {[['low', 'low craving'], ['mid', 'moderate'], ['high', 'high craving']].map(([level, text]) => (
          <div key={level} className="legend-item">
            <span className={`legend-dot bar-${level}`} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MoodTrendCard({ moodWeek, sparkline, bestMoodDay, worstCravingDay }) {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 14 }}>Mood Trend — Last 7 Days</div>
      <div className="mood-week">
        {moodWeek.map(({ emoji, label }) => (
          <div key={label} className="mood-day-col">
            <span className="mood-emoji">{emoji}</span>
            <span className="mood-day-label">{label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="section-label" style={{ marginBottom: 8 }}>Craving intensity this week</div>
        <div className="sparkline">
          {sparkline.map(({ height, level }, i) => (
            <div key={i} className={`spark-bar bg-${level}`} style={{ height: `${height}%` }} />
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--bg-tag)', borderRadius: 10, padding: '10px 14px' }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Best mood day</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{bestMoodDay}</div>
        </div>
        <div style={{ background: 'var(--bg-tag)', borderRadius: 10, padding: '10px 14px' }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Worst craving day</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>{worstCravingDay}</div>
        </div>
      </div>
    </div>
  )
}

function MilestoneJourney({ milestones }) {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="section-label" style={{ marginBottom: 24 }}>Milestone Journey</div>
      <div className="milestone-container">
        <div className="milestone-line-bg" />
        <div className="milestone-line-fill" />
        {milestones.map(({ label, sub, done }) => (
          <div key={label} className="milestone-step">
            <div className={`milestone-circle ${done ? 'done' : 'todo'}`}>{done ? '✓' : '○'}</div>
            <div className="milestone-label" style={{ color: done ? 'var(--green)' : 'var(--text-muted)' }}>{label}</div>
            <div className="milestone-sub">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VapingPatternsCard({ patterns }) {
  if (!patterns) return null; // Failsafe until backend is connected

  const stats = [
    { label: 'Highest Risk Time', value: patterns.topTimeSlot || 'N/A', icon: '⏱️' },
    { label: 'Primary Device', value: patterns.topDevice || 'N/A', icon: '🔋' },
    { label: 'Avg. Session Length', value: patterns.avgDuration || 'N/A', icon: '⏳' },
    { label: 'Avg. Sessions/Day', value: patterns.avgSessionsPerRelapseDay || '0', icon: '📊' }
  ];

  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 16 }}>Vaping Patterns & Habits</div>
      <div className="patterns-grid">
        {stats.map((stat, idx) => (
          <div key={idx} className="pattern-stat-box">
            <div className="pattern-icon">{stat.icon}</div>
            <div>
              <div className="pattern-label">{stat.label}</div>
              <div className="pattern-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Patient identity banner (mirrors HistoryPage) ─────────────
function PatientBanner({ patient }) {
  if (!patient) return null
  return (
    <div className="stat-patient-banner">
      <div className="p-avatar-sm stat-banner-avatar">{patient.emoji}</div>
      <div>
        <div className="stat-banner-name">{patient.name}</div>
        <div className="stat-banner-sub">
          {patient.sex} · {patient.age} y/o · Day {patient.day}
          <span
            className="stat-banner-dot"
            style={{
              background:
                patient.status === 'stable'  ? 'var(--green)' :
                patient.status === 'monitor' ? 'var(--amber)' : 'var(--red)',
            }}
          />
          <span style={{ textTransform: 'capitalize' }}>{patient.status}</span>
        </div>
      </div>
    </div>
  )
}

export default function StatisticsPage({ activePatientId }) {
  const [statData, setStatData]   = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      api.getPatientProfile(activePatientId),
      api.getPatientLogHistory(activePatientId)
    ])
      .then(([profileData, logs]) => {
        profileData.insights.vapingPatterns = calculateVapingPatterns(logs)
        setStatData(profileData)
      })
      .catch((err) => console.error("Error fetching statistics:", err))
      .finally(() => setIsLoading(false))
  }, [activePatientId])

  if (isLoading || !statData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading patient statistics...
      </div>
    )
  }

  const { insights, info } = statData

  return (
    <div>
      {/* ── Patient identity banner ── */}
      <PatientBanner patient={info} />

      <div className="stat-grid">
        <StatBox label="Smoke-free streak"  value={insights.streakDays} subText="days"                             delta={insights.streakDays > 0 ? "↑ On track" : "↓ Relapse recorded"}    deltaType={insights.streakDays > 0 ? "up" : "down"} valueColor={insights.streakDays > 0 ? "var(--green)" : "var(--red)"} />
        <StatBox label="Relapse risk score" value={insights.riskScore}  subText={`/ 100 · ${insights.riskLevel}`}  delta={insights.riskScore > 50 ? "↑ Increased risk" : "↓ Decreased risk"} deltaType={insights.riskScore > 50 ? "down" : "up"}  valueColor={insights.riskScore > 50 ? "var(--red)" : "var(--green)"} />
        <StatBox label="Avg. mood (7 days)" value={insights.avgMood}    subText="/ 5.0"                            delta="vs previous week"                                                   deltaType={insights.avgMood > 3 ? "up" : "down"} />
        <StatBox label="Adherence rate"     value={insights.adherence}  subText="logged this period"               delta="App engagement"                                                     deltaType={insights.adherence === '100%' ? "up" : "down"} valueColor={insights.adherence === '100%' ? "var(--green)" : "var(--amber)"} />
      </div>

      <InsightsSeparator label="Detailed Insights" />

      <div className="two-col">
        <RiskScoreCard
          score={insights.riskScore}
          level={insights.riskLevel}
          topTrigger={insights.correlation[0]?.trigger ?? '—'}
          highestRiskDay={insights.highestRiskDay}
          lastRelapse={insights.lastRelapse}
        />
        <CorrelationCard correlationList={insights.correlation} />
      </div>

      <div className="two-col">
        <StreakChart streakData={insights.streaks} />
        <MoodTrendCard
          moodWeek={insights.moodWeek}
          sparkline={insights.sparkline}
          bestMoodDay={insights.bestMoodDay}
          worstCravingDay={insights.worstCravingDay}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <VapingPatternsCard patterns={insights.vapingPatterns} />
      </div>

      <MilestoneJourney milestones={insights.milestones} />
    </div>
  )
}