import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { moodLogOptions, triggerTagList, cravingThresholds } from '../data/mockData.js'

// ── Helpers ───────────────────────────────────────────────────
function getMoodEmoji(moodLabel) {
  return moodLogOptions.find(m => m.label === moodLabel)?.emoji ?? '😐'
}

function getCravingLabel(level) {
  return cravingThresholds.find(t => level < t.max)?.label ?? 'Intense'
}

function getCravingColor(level) {
  if (level < 30) return 'var(--green)'
  if (level < 60) return 'var(--amber)'
  return 'var(--red)'
}

// ── Expanded detail row ───────────────────────────────────────
function ExpandedRow({ entry }) {
  const cravingLabel = getCravingLabel(entry.cravingLevel)
  const cravingColor = getCravingColor(entry.cravingLevel)

  return (
    <div className="hist-expanded">
      {/* Mood */}
      <div className="hist-expanded-section">
        <div className="section-label hist-section-label">Reported Feeling</div>
        <div className="hist-mood-row">
          {moodLogOptions.map(({ emoji, label }) => {
            const isSelected = entry.mood === label
            return (
              <div key={label} className={`hist-mood-chip ${isSelected ? 'selected' : ''}`}>
                <span className={isSelected ? '' : 'hist-chip-faded'}>{emoji}</span>
                <span className={`hist-mood-chip-label ${isSelected ? '' : 'hist-chip-faded'}`}>{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Triggers */}
      <div className="hist-expanded-section">
        <div className="section-label hist-section-label">Triggers</div>
        <div className="hist-trigger-row">
          {triggerTagList.filter(t => t !== '+ Other').map(tag => {
            const active = entry.triggers.includes(tag)
            return (
              <span key={tag} className={`tag-pill ${active ? 'hist-tag-active' : 'hist-tag-inactive'}`}>
                {tag}
              </span>
            )
          })}
          {entry.triggers.length === 0 && (
            <span className="hist-no-triggers">No triggers reported</span>
          )}
        </div>
      </div>

      {/* Craving bar */}
      <div className="hist-expanded-section">
        <div className="section-label hist-section-label">Craving Intensity</div>
        <div className="hist-craving-row">
          <div className="hist-craving-track">
            <div className="hist-craving-fill" style={{ width: `${entry.cravingLevel}%`, background: cravingColor }} />
          </div>
          <span className="hist-craving-label" style={{ color: cravingColor }}>
            {entry.cravingLevel}/100 · {cravingLabel}
          </span>
        </div>
      </div>

      {/* Vaping status */}
      <div className="hist-expanded-section">
        <div className="section-label hist-section-label">Vaping Status</div>
        <div className="hist-vape-row">
          <span className={`hist-vape-chip ${entry.vapedToday === 'No' ? 'hist-vape-clean' : 'hist-vape-dim'}`}>
            ✓ No vaping
          </span>
          <span className={`hist-vape-chip ${entry.vapedToday === 'Yes' ? 'hist-vape-relapse' : 'hist-vape-dim'}`}>
            ✗ Vaped today
          </span>
        </div>
      </div>

      {/* Notes */}
      {entry.notes && (
        <div className="hist-expanded-section hist-expanded-last">
          <div className="section-label hist-section-label">Patient Note</div>
          <p className="hist-note-text">"{entry.notes}"</p>
        </div>
      )}
    </div>
  )
}

// ── Single log row ────────────────────────────────────────────
function LogRow({ entry, isExpanded, onToggle }) {
  const cravingLabel = getCravingLabel(entry.cravingLevel)
  const cravingColor = getCravingColor(entry.cravingLevel)
  const moodEmoji    = getMoodEmoji(entry.mood)

  return (
    <>
      <tr className={`hist-row ${isExpanded ? 'expanded' : ''}`} onClick={onToggle}>
        <td style={{ paddingLeft: 24 }}>
          <div className="hist-date">{entry.date}</div>
        </td>
        <td>
          <span className="hist-mood-emoji">{moodEmoji}</span>
          <span className="hist-mood-text">{entry.mood}</span>
        </td>
        <td>
          {entry.triggers.length > 0 ? (
            <span className="tag-pill">
              {entry.triggers[0]}{entry.triggers.length > 1 ? ` +${entry.triggers.length - 1}` : ''}
            </span>
          ) : (
            <span className="hist-none-label">None</span>
          )}
        </td>
        <td>
          <span className="hist-craving-text" style={{ color: cravingColor }}>
            {entry.cravingLevel} – {cravingLabel}
          </span>
        </td>
        <td>
          <span
            className="status-pill"
            style={{
              background: entry.vapedToday === 'No' ? 'rgba(47,206,156,0.10)' : 'rgba(246,95,95,0.10)',
              color:      entry.vapedToday === 'No' ? '#047857' : '#B91C1C',
              border:     entry.vapedToday === 'No' ? '1px solid rgba(47,206,156,0.25)' : '1px solid rgba(246,95,95,0.25)',
            }}
          >
            {entry.vapedToday === 'No' ? 'No vaping' : 'Vaped'}
          </span>
        </td>
        <td style={{ textAlign: 'right', paddingRight: 24 }}>
          <svg
            className="hist-chevron"
            width="16" height="16" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={6} className="hist-expanded-cell">
            <ExpandedRow entry={entry} />
          </td>
        </tr>
      )}
    </>
  )
}

// ── Summary stat cards ────────────────────────────────────────
function HistorySummary({ logs }) {
  if (!logs.length) return null

  const vapeFreeDays = logs.filter(l => l.vapedToday === 'No').length
  const relapses     = logs.filter(l => l.vapedToday === 'Yes').length
  const avgCraving   = Math.round(logs.reduce((s, l) => s + l.cravingLevel, 0) / logs.length)
  const moodScoreMap = { Awful: 1, Bad: 2, Okay: 3, Good: 4, Great: 5 }
  const avgMoodScore = (logs.reduce((s, l) => s + (moodScoreMap[l.mood] ?? 3), 0) / logs.length).toFixed(1)

  return (
    <div className="hist-summary">
      <div className="pl-sum-card">
        <div className="section-label">Vape-free days</div>
        <div className="pl-sum-val" style={{ color: 'var(--green)' }}>{vapeFreeDays}</div>
        <div className="hist-sum-sub">of {logs.length} logged</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Relapses</div>
        <div className="pl-sum-val" style={{ color: relapses > 0 ? 'var(--red)' : 'var(--green)' }}>{relapses}</div>
        <div className="hist-sum-sub">days vaped</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Avg. craving</div>
        <div className="pl-sum-val" style={{ color: getCravingColor(avgCraving) }}>{avgCraving}</div>
        <div className="hist-sum-sub">out of 100</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Avg. mood</div>
        <div className="pl-sum-val">{avgMoodScore}</div>
        <div className="hist-sum-sub">out of 5.0</div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function HistoryPage({ activePatientId, patientsList, onBack }) {
  const [logs,        setLogs]        = useState([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [expandedIdx, setExpandedIdx] = useState(null)
  const [filterVaped, setFilterVaped] = useState('All')

  const patient = patientsList.find(p => p.id === activePatientId)

  useEffect(() => {
    setIsLoading(true)
    setExpandedIdx(null)
    api.getPatientLogHistory(activePatientId)
      .then(data => setLogs(data))
      .catch(err => console.error('Failed to load history:', err))
      .finally(() => setIsLoading(false))
  }, [activePatientId])

  const filteredLogs = logs.filter(l =>
    filterVaped === 'All' ? true : l.vapedToday === filterVaped
  )

  function toggleRow(idx) {
    setExpandedIdx(prev => prev === idx ? null : idx)
  }

  return (
    <div>
      {/* ── Page header ── */}
      <div className="hist-page-header">
        <div className="hist-header-left">
          <button className="hist-back-btn" onClick={onBack}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          {patient && (
            <div className="hist-patient-identity">
              <div className="p-avatar-sm hist-avatar">{patient.emoji}</div>
              <div>
                <div className="hist-patient-name">{patient.name}</div>
                <div className="hist-patient-sub">Daily Log History</div>
              </div>
            </div>
          )}
        </div>

        <div className="hist-filter-row">
          {['All', 'No', 'Yes'].map(f => (
            <button
              key={f}
              onClick={() => setFilterVaped(f)}
              className={`filter-btn${filterVaped === f ? ' active' : ''}`}
            >
              {f === 'All' ? 'All days' : f === 'No' ? 'Vape-free' : 'Relapsed'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary stats ── */}
      {!isLoading && <HistorySummary logs={logs} />}

      {/* ── Log table ── */}
      {isLoading ? (
        <div className="hist-loading">Loading log history...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="card hist-empty">
          <div className="hist-empty-icon">📋</div>
          <p className="hist-empty-text">No log entries found.</p>
        </div>
      ) : (
        <div className="card hist-table-card">
          <table className="patient-table">
            <thead style={{ background: 'var(--surface-2)' }}>
              <tr>
                <th style={{ paddingLeft: 24 }}>Date</th>
                <th>Mood</th>
                <th>Top Trigger</th>
                <th>Craving Level</th>
                <th>Vaping</th>
                <th style={{ textAlign: 'right', paddingRight: 24 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((entry, idx) => (
                <LogRow
                  key={entry.date}
                  entry={entry}
                  isExpanded={expandedIdx === idx}
                  onToggle={() => toggleRow(idx)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="hist-footer">
        Showing {filteredLogs.length} of {logs.length} entries
      </div>
    </div>
  )
}