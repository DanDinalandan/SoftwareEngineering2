import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { moodLogOptions, triggerTagList, cravingThresholds } from '../data/mockData.js'

// ── Patient summary card ────────────────
function PatientSummaryCard({ patient, onSelectPatient, allPatients }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card patient-summary-card" style={{ position: 'relative', flexDirection: 'column', gap: 0, padding: 0, overflow: 'visible' }}>
      {/* ── Current patient row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: 24 }}>
        <div className="summary-avatar">{patient.emoji}</div>
        <div className="summary-details" style={{ flex: 1 }}>
          <h2>{patient.name}</h2>
          <p style={{ display: 'flex', alignItems: 'center' }}>
            {patient.sex} &nbsp;·&nbsp; {patient.age} y/o &nbsp;·&nbsp; 
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%', margin: '0 6px 0 4px',
              background:
                patient.status === 'stable'  ? 'var(--green)' :
                patient.status === 'monitor' ? 'var(--amber)'  : 'var(--red)',
            }} />
            <span style={{ textTransform: 'capitalize' }}>{patient.status}</span>
          </p>
        </div>

        {/* Switch patient button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border-subtle)',
            color: 'var(--text-dark)',
            borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            transition: 'border-color 0.2s',
          }}
        >
          Switch
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ── Dropdown patient list ── */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--surface-1)',
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 8px 24px rgba(30,33,71,0.15)',
          border: '1px solid var(--border-subtle)',
          borderTop: 'none', overflow: 'hidden',
        }}>
          {allPatients.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelectPatient(p.id); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 20px',
                background: p.id === patient.id ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--bg-tag)',
                border: '1.5px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>
                {p.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Day {p.day} · {p.status}</div>
              </div>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background:
                  p.status === 'stable'  ? 'var(--green)' :
                  p.status === 'monitor' ? 'var(--amber)'  : 'var(--red)',
              }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Read-Only Mood Log Card (Provider View) ──────────────────────────────────
function MoodLogCard({ todaysLog, onOpenHistory }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Today's Log</h3>
        <button className="history-link" onClick={onOpenHistory}>History</button>
      </div>

      {/* IF PATIENT HAS NOT LOGGED YET TODAY */}
      {!todaysLog ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>📱</div>
          <p style={{ fontWeight: 600, fontSize: '14px' }}>Waiting for patient to submit today's log.</p>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Last submission: Yesterday at 8:45 PM</p>
        </div>
      ) : (
        <>
          {/* ── Current feeling row ── */}
          <div className="mood-container" style={{ borderTop: 'none', paddingTop: 0 }}>
            <div className="section-label">Reported Feeling</div>
            <div className="emoji-row">
              {moodLogOptions.map(({ emoji, label }) => {
                const isSelected = todaysLog.mood === label
                return (
                  <div key={label} className={`emoji-card ${isSelected ? 'selected' : ''}`} style={{ cursor: 'default' }}>
                    <span className="emoji" style={{ opacity: isSelected ? 1 : 0.3 }}>{emoji}</span>
                    <span className="label" style={{ opacity: isSelected ? 1 : 0.3 }}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Reported triggers ── */}
          <div className="triggers-container">
            <div className="section-label">Reported Triggers</div>
            <div className="trigger-tags">
              {triggerTagList.map((tag) => {
                const isSelected = todaysLog.triggers.includes(tag)
                return (
                  <span key={tag} className={`tag ${isSelected ? 'active' : ''}`} style={{ cursor: 'default', opacity: isSelected ? 1 : 0.4 }}>
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>

          {/* ── Did patient vape today? ── */}
          <div className="survey-container">
            <div className="section-label">Did patient vape today?</div>
            <div className="survey-actions">
              <div className={`survey-btn ${todaysLog.vapedToday === 'No' ? 'active' : ''}`} style={{ cursor: 'default', textAlign: 'center', opacity: todaysLog.vapedToday === 'No' ? 1 : 0.3 }}>
                No
              </div>
              <div className={`survey-btn ${todaysLog.vapedToday === 'Yes' ? 'active' : ''}`} style={{ cursor: 'default', textAlign: 'center', background: todaysLog.vapedToday === 'Yes' ? 'var(--red)' : '', borderColor: todaysLog.vapedToday === 'Yes' ? 'var(--red)' : '', opacity: todaysLog.vapedToday === 'Yes' ? 1 : 0.3 }}>
                Yes
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Cravings log card ─────────────────────────────────────────
function CravingsLogCard({ cravingLevel, vapedToday, onOpenHistory }) {
  const [sliderValue, setSliderValue] = useState(cravingLevel)

  // Derive label from thresholds defined in mockData
  const cravingLabel = cravingThresholds.find(t => sliderValue < t.max)?.label ?? 'Intense'
  const vapeText     = vapedToday === 'Yes' ? 'Vaping reported today' : 'No vaping reported today'

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Cravings Log</h3>
        <button className="history-link" onClick={onOpenHistory}>History</button>
      </div>

      <div className="cravings-subtitle">
        {cravingLabel} – {vapeText}
      </div>

      <div className="slider-track">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderValue}
          onChange={(e) => setSliderValue(Number(e.target.value))}
          className="custom-slider"
        />
        <div className="slider-labels">
          <span>None</span>
          <span className="mid-label">Moderate</span>
          <span>Intense</span>
        </div>
      </div>
    </div>
  )
}

// ── Relapse risk score card ───────────────────────────────────
function RelapseRiskCard({ score, level }) {
  const dotPosition = `${Math.max(5, Math.min(score, 95))}%`

  return (
    <div className="card">
      <div className="card-header">
        <div className="section-label" style={{ marginBottom: 0 }}>Relapse Risk Score</div>
        <span className="risk-badge">{score}/100</span>
      </div>
      <div className="risk-meta">{level}</div>
      <div className="bar-wrapper">
        <div className="gradient-bar">
          <div className="bar-indicator" style={{ left: dotPosition }} />
        </div>
        <div className="slider-labels" style={{ fontSize: 10 }}>
          <span>Safe</span><span>Moderate</span><span>High</span>
        </div>
      </div>
    </div>
  )
}

// ── Mood-trigger correlation table ───────────────────────────
function CorrelationCard({ correlationList }) {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 16 }}>Mood-Trigger Correlation</div>
      <div className="matrix-table">
        <div className="dash-matrix-row matrix-th">
          <span className="col-trigger">Trigger</span>
          <span className="col-bar" style={{ textAlign: 'center' }}>Correlation</span>
          <span className="col-score">Score</span>
          <span className="col-freq">Freq</span>
        </div>
        {correlationList.map(({ trigger, width, level, freq }) => (
          <div key={trigger} className="dash-matrix-row">
            <span className="col-trigger">{trigger}</span>
            <div className="col-bar">
              <div className="matrix-bar-bg">
                <div className={`matrix-bar-fill bg-${level}`} style={{ width: `${width}%` }} />
              </div>
            </div>
            <span className="col-score">{width}%</span>
            <span className="col-freq">{freq}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Streak progress chart ─────────────────────────────────────
function StreakChart({ streakData }) {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 24 }}>Streak Progress — 14 Days</div>
      <div className="chart-axis-container">
        {streakData.map(({ label, height, level }, index) => (
          <div key={index} className="bar-node">
            <div className={`chart-bar bg-${level}`} style={{ height }} />
            <span className="axis-label">{label}</span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        {[['low', 'low'], ['mid', 'moderate'], ['high', 'high']].map(([level, text]) => (
          <div key={level} className="legend-item">
            <span className={`legend-dot bg-${level}`} />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage({ activePatientId, allPatients, onSelectPatient, onOpenHistory }) {
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading]         = useState(true)

  useEffect(() => {
    setIsLoading(true)
    api.getPatientDashboard(activePatientId)
      .then((data) => setDashboardData(data))
      .catch((err) => console.error("Error fetching dashboard:", err))
      .finally(() => setIsLoading(false))
  }, [activePatientId])

  if (isLoading || !dashboardData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading patient data...
      </div>
    )
  }

  return (
    <div>
      <div className="dashboard-grid">

        {/* LEFT COLUMN */}
        <div className="col-left">
          <PatientSummaryCard
            patient={dashboardData.info}
            allPatients={allPatients}
            onSelectPatient={onSelectPatient}
          />

          <MoodLogCard todaysLog={dashboardData.todaysLog} onOpenHistory={onOpenHistory} />

          <CravingsLogCard
            cravingLevel={dashboardData.insights.cravingLevel}
            vapedToday={dashboardData.todaysLog?.vapedToday ?? 'No'}
            onOpenHistory={onOpenHistory}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-right">
          <div className="insights-separator">
            <span className="insights-title">Insights</span>
            <div className="line" />
          </div>

          <RelapseRiskCard
            score={dashboardData.insights.riskScore}
            level={dashboardData.insights.riskLevel}
          />
          <CorrelationCard
            correlationList={dashboardData.insights.correlation}
          />
          <StreakChart
            streakData={dashboardData.insights.streaks}
          />
        </div>

      </div>
    </div>
  )
}