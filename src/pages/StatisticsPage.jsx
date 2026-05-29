import { correlationData, streakBars, moodWeek, sparklineData, milestones } from '../data/mockData.js'

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

      <div className="stat-val" style={valueColor ? { color: valueColor } : {}}>
        {value}
      </div>

      <div style={{ fontSize: 13, color: 'var(--bg-canvas)' }}>{subText}</div>

      <div className={deltaType === 'up' ? 'delta-up' : 'delta-down'}>
        {delta}
      </div>
    </div>
  )
}

// ── Relapse risk score card ───────────────────────────────────
function RiskScoreCard() {
  const tiles = [
    { label: 'Primary trigger',  value: 'Stress (social)',   color: null           },
    { label: 'Risk trajectory',  value: '↓ Stable decline',  color: 'var(--green)' },
    { label: 'Highest-risk day', value: 'Friday',            color: null           },
    { label: 'Last relapse',     value: 'None recorded',     color: null           },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-label" style={{ margin: 0 }}>Relapse Risk Score</div>
        <span className="risk-badge">28 / 100</span>
      </div>

      <div className="risk-val">Low-Moderate</div>

      <div style={{ position: 'relative' }}>
        <div className="gradient-bar">
          <div className="bar-indicator" />
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

// ── Mood-trigger correlation table ───────────────────────────
function CorrelationCard() {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 16 }}>Mood–Trigger Correlation</div>

      <div className="matrix-table">
        {/* Header row */}
        <div className="matrix-row matrix-th">
          <span>Trigger</span>
          <span style={{ textAlign: 'center' }}>Correlation to low mood</span>
          <span style={{ textAlign: 'right' }}>Score</span>
          <span style={{ textAlign: 'right' }}>Freq</span>
        </div>

        {correlationData.map(({ trigger, width, level, freq }) => (
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

// ── 14-day craving intensity bar chart ───────────────────────
function StreakChart() {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 20 }}>Streak Progress — 14 Days</div>

      <div className="chart-axis">
        {streakBars.map(({ label, height, level }, index) => (
          <div key={index} className="bar-node">
            <div className={`chart-bar bar-${level}`} style={{ height }} />
            <span className="axis-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
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

// ── Mood trend + sparkline card ───────────────────────────────
function MoodTrendCard() {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 14 }}>Mood Trend — Last 7 Days</div>

      {/* Emoji row */}
      <div className="mood-week">
        {moodWeek.map(({ emoji, label }) => (
          <div key={label} className="mood-day-col">
            <span className="mood-emoji">{emoji}</span>
            <span className="mood-day-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Craving sparkline */}
      <div style={{ marginTop: 18 }}>
        <div className="section-label" style={{ marginBottom: 8 }}>Craving intensity this week</div>
        <div className="sparkline">
          {sparklineData.map(({ height, level }, i) => (
            <div key={i} className={`spark-bar bar-${level}`} style={{ height }} />
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(139,107,80,0.3)', margin: '16px 0' }} />

      {/* Best / worst summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: 'var(--bg-tag)', borderRadius: 10, padding: '10px 14px' }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Best mood day</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Friday 🙂</div>
        </div>
        <div style={{ background: 'var(--bg-tag)', borderRadius: 10, padding: '10px 14px' }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Worst craving day</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>Friday ⚠️</div>
        </div>
      </div>
    </div>
  )
}

// ── Milestone Journey timeline ────────────────────────────────
function MilestoneJourney() {
  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div className="section-label" style={{ marginBottom: 24 }}>Milestone Journey</div>

      <div className="milestone-container">
        {/* Background line (full width, grey) */}
        <div className="milestone-line-bg" />
        {/* Foreground line (partial width, green — shows progress) */}
        <div className="milestone-line-fill" />

        {/* One milestone node per entry in the array */}
        {milestones.map(({ label, sub, done }) => (
          <div key={label} className="milestone-step">
            <div className={`milestone-circle ${done ? 'done' : 'todo'}`}>
              {done ? '✓' : '○'}
            </div>
            <div
              className="milestone-label"
              style={{ color: done ? 'var(--green)' : 'var(--bg-canvas)' }}
            >
              {label}
            </div>
            <div className="milestone-sub">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}


function StatisticsPage() {
  return (
    <div>

      <div className="stat-grid">
        <StatBox label="Smoke-free streak"   value="14"   subText="days"                 delta="↑ On track · 30-day goal"    deltaType="up"                            />
        <StatBox label="Relapse risk score"  value="28"   subText="/ 100 · Low-Moderate" delta="↓ Decreased 4 pts this week" deltaType="up" valueColor="var(--green)"  />
        <StatBox label="Avg. mood (7 days)"  value="3.4"  subText="/ 5.0"                delta="↑ +0.4 vs previous week"     deltaType="up"                            />
        <StatBox label="Adherence rate"      value="100%" subText="14 / 14 days logged"  delta="↑ Perfect this period"       deltaType="up" valueColor="var(--green)"  />
      </div>

      <InsightsSeparator label="Detailed Insights" />

      {/* Row 1: Risk + Correlation */}
      <div className="two-col">
        <RiskScoreCard />
        <CorrelationCard />
      </div>

      {/* Row 2: Streak chart + Mood trend */}
      <div className="two-col">
        <StreakChart />
        <MoodTrendCard />
      </div>

      {/* Milestone journey */}
      <MilestoneJourney />
    </div>
  )
}

export default StatisticsPage
