import { useState } from 'react'
import {
  moodOptions,
  triggerTags,
  correlationData,
  streakBars,
  currentPatient,
} from '../data/mockData.js'

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
          <p>
            {patient.sex} &nbsp;·&nbsp; {patient.age} y/o &nbsp;·&nbsp; {patient.condition}
          </p>
        </div>

        {/* Switch patient button */}
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'rgba(248,238,228,0.12)', border: '1px solid rgba(248,238,228,0.2)', color: 'var(--text-light)', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
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
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', borderRadius: '0 0 16px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', border: '1px solid rgba(139,107,80,0.4)', borderTop: 'none', overflow: 'hidden' }}>
          {allPatients.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelectPatient(p.id); setOpen(false) }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: p.id === patient.id ? 'rgba(248,238,228,0.08)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(139,107,80,0.2)', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-tag)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--bg-canvas)' }}>Day {p.day} · {p.status}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.status === 'stable' ? 'var(--green)' : p.status === 'monitor' ? 'var(--amber)' : 'var(--red)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Mood log card ─────────────────────────────────────────────
function MoodLogCard() {
  const [selectedMood, setSelectedMood] = useState('Okay')

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Mood Log</h3>
        <button className="history-link">History</button>
      </div>

      {/* ── Current feeling row ── */}
      <div className="mood-container">
        <div className="section-label">Current Feeling</div>
        <div className="emoji-row">
          {moodOptions.map(({ emoji, label }) => (
            <div
              key={label}
              className={`emoji-card${selectedMood === label ? ' selected' : ''}`}
              onClick={() => setSelectedMood(label)}
            >
              <span className="emoji">{emoji}</span>
              <span className="label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reported triggers ── */}
      <div className="triggers-container">
        <div className="section-label">Reported Triggers</div>
        <div className="trigger-tags">
          {triggerTags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          <span className="tag other">+ Other</span>
        </div>
      </div>

      {/* ── Did patient vape today? ── */}
      <div className="survey-container">
        <div className="section-label">Did patient vape today?</div>
        <div className="survey-actions">
          {/* These can also be made interactive with useState if needed */}
          <button className="survey-btn active">No</button>
          <button className="survey-btn inactive">Yes</button>
        </div>
      </div>
    </div>
  )
}

// ── Cravings log card ─────────────────────────────────────────
function CravingsLogCard() {
  const [sliderValue, setSliderValue] = useState(45)

  const cravingLabel =
    sliderValue < 30 ? 'Mild'          :
    sliderValue < 60 ? 'Mild-Moderate' :
    sliderValue < 80 ? 'Moderate'      : 'Intense'

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Cravings Log</h3>
        <button className="history-link">History</button>
      </div>

      {/* Subtitle updates as the slider moves */}
      <div className="cravings-subtitle">
        {cravingLabel} – No vaping reported today
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
function RelapseRiskCard() {
  return (
    <div className="card">
      <div className="card-header">
        {/* marginBottom:0 overrides the .section-label default so it sits flush */}
        <div className="section-label" style={{ marginBottom: 0 }}>
          Relapse Risk Score
        </div>
        <span className="risk-badge">28/100</span>
      </div>

      <div className="risk-meta">Low-Moderate</div>

      <div className="bar-wrapper">
        <div className="gradient-bar">
          <div className="bar-indicator" style={{ left: '28%' }} />
        </div>
        <div className="slider-labels" style={{ fontSize: 10 }}>
          <span>Safe</span>
          <span>Moderate</span>
          <span>High</span>
        </div>
      </div>
    </div>
  )
}

// ── Mood-trigger correlation table ───────────────────────────
function CorrelationCard() {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 16 }}>
        Mood-Trigger Correlation
      </div>

      <div className="matrix-table">
        {/* Header row */}
        <div className="dash-matrix-row matrix-th">
          <span className="col-trigger">Trigger</span>
          <span className="col-bar" style={{ textAlign: 'center' }}>Correlation</span>
          <span className="col-score">Score</span>
          <span className="col-freq">Freq</span>
        </div>

        {/* Data rows */}
        {correlationData.map(({ trigger, width, level, freq }) => (
          <div key={trigger} className="dash-matrix-row">
            <span className="col-trigger">{trigger}</span>
            <div className="col-bar">
              <div className="matrix-bar-bg">
                <div
                  className={`matrix-bar-fill bg-${level}`}
                  style={{ width: `${width}%` }}
                />
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
function StreakChart() {
  return (
    <div className="card">
      <div className="section-label" style={{ marginBottom: 24 }}>
        Streak Progress
      </div>

      {/* Bar chart */}
      <div className="chart-axis-container">
        {streakBars.map(({ label, height, level }, index) => (
          // index as key because day labels repeat (two Mondays, etc.)
          <div key={index} className="bar-node">
            <div
              className={`chart-bar bg-${level}`}
              style={{ height }}
            />
            <span className="axis-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
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

export default function DashboardPage({ activePatient, activePatientId, onSelectPatient, allPatients }) {
  const patient = activePatient ?? currentPatient

  return (
    <div>

      {/* ── Two-column grid ── */}
      <div className="dashboard-grid">

        {/* LEFT COLUMN: patient info + logs */}
        <div className="col-left">
          <PatientSummaryCard
            patient={patient}
            allPatients={allPatients ?? []}
            onSelectPatient={onSelectPatient ?? (() => {})}
          />
          <MoodLogCard />
          <CravingsLogCard />
        </div>

        {/* RIGHT COLUMN: insights */}
        <div className="col-right">
          <div className="insights-separator">
            <span className="insights-title">Insights</span>
            <div className="line" />
          </div>

          <RelapseRiskCard />
          <CorrelationCard />
          <StreakChart />
        </div>

      </div>
    </div>
  )
}
