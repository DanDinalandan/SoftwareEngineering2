import { useState } from 'react'
import { patients } from '../data/mockData.js'

const FILTERS = ['All', 'Stable', 'Monitor', 'Alert', 'Inactive']

// ── Summary cards at the top ──────────────────────────────────
function SummaryCards() {
  const total   = patients.length
  const stable  = patients.filter(p => p.status === 'stable').length
  const monitor = patients.filter(p => p.status === 'monitor').length
  const alert   = patients.filter(p => p.status === 'alert').length

  return (
    <div className="pl-summary">
      <div className="pl-sum-card">
        <div className="section-label">Total patients</div>
        <div className="pl-sum-val">{total}</div>
        <div style={{ fontSize: 12, color: 'var(--bg-canvas)' }}>Under monitoring</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Stable</div>
        <div className="pl-sum-val" style={{ color: 'var(--green)' }}>{stable}</div>
        <div style={{ fontSize: 12, color: 'var(--bg-canvas)' }}>Low risk</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Monitor</div>
        <div className="pl-sum-val" style={{ color: 'var(--amber)' }}>{monitor}</div>
        <div style={{ fontSize: 12, color: 'var(--bg-canvas)' }}>Elevated risk</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Alert</div>
        <div className="pl-sum-val" style={{ color: 'var(--red)' }}>{alert}</div>
        <div style={{ fontSize: 12, color: 'var(--bg-canvas)' }}>Needs attention</div>
      </div>
    </div>
  )
}

// ── A single table row for one patient ────────────────────────
function PatientRow({ patient }) {
  const streakColor =
    patient.streak === 0          ? 'var(--red)'   :
    patient.status === 'monitor'  ? 'var(--amber)' :
                                    'var(--green)'

  return (
    <tr>
      {/* Name + avatar */}
      <td style={{ paddingLeft: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="p-avatar-sm">{patient.emoji}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{patient.name}</div>
            <div style={{ fontSize: 11, color: 'var(--bg-canvas)' }}>{patient.email}</div>
          </div>
        </div>
      </td>

      <td>{patient.age} / {patient.sex}</td>
      <td>Day {patient.day}</td>
      <td style={{ fontWeight: 700, color: streakColor }}>{patient.streakLabel}</td>
      <td>{patient.lastMood}</td>

      {/* Trigger pill — red tint for high-risk triggers */}
      <td>
        <span className={`tag-pill${patient.triggerLevel === 'high' ? ' tag-pill-high' : ''}`}>
          {patient.topTrigger}
        </span>
      </td>

      {/* Risk score with coloured dot */}
      <td>
        <span className="risk-dot" style={{ background: patient.riskColor }} />
        {patient.riskScore}
      </td>

      {/* Status pill */}
      <td>
        <span className={`status-pill status-${patient.status}`}>
          {patient.status}
        </span>
      </td>

      <td style={{ textAlign: 'right', paddingRight: 24 }}>
        <button className="btn-view">View</button>
      </td>
    </tr>
  )
}

// ── Main Page Component ───────────────────────────────────────
function PatientListPage() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchTerm,   setSearchTerm  ] = useState('')

  const filtered = patients.filter((p) => {
    const matchesFilter =
      activeFilter === 'All' ||
      p.status === activeFilter.toLowerCase()

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.topTrigger.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesFilter && matchesSearch
  })

  return (
    <div>

      <SummaryCards />

      {/* Toolbar: search input + filter tab buttons */}
      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="Search by name or trigger..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Patient table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="patient-table">
          <thead style={{ background: 'rgba(92,55,27,0.3)' }}>
            <tr>
              <th style={{ paddingLeft: 24 }}>Patient</th>
              <th>Age / Sex</th>
              <th>Day</th>
              <th>Streak</th>
              <th>Last mood</th>
              <th>Top trigger</th>
              <th>Risk score</th>
              <th>Status</th>
              <th style={{ paddingRight: 24, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>

            {/* Render one PatientRow per filtered result */}
            {filtered.map((p) => (
              <PatientRow key={p.id} patient={p} />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(92,55,27,0.55)', textAlign: 'right' }}>
        Showing {filtered.length} of {patients.length} patients
      </div>
    </div>
  )
}

export default PatientListPage
