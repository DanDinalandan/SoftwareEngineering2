import { useState } from 'react'
import { api } from '../services/api.js'

const FILTERS = ['All', 'Stable', 'Monitor', 'Alert', 'Inactive']

// ── Summary cards at the top ──────────────────────────────────
function SummaryCards({ patientsList }) {
  const total   = patientsList.length
  const stable  = patientsList.filter(p => p.status === 'stable').length
  const monitor = patientsList.filter(p => p.status === 'monitor').length
  const alert   = patientsList.filter(p => p.status === 'alert').length

  return (
    <div className="pl-summary">
      <div className="pl-sum-card">
        <div className="section-label">Total patients</div>
        <div className="pl-sum-val">{total}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Under monitoring</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Stable</div>
        <div className="pl-sum-val" style={{ color: 'var(--green)' }}>{stable}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Low risk</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Monitor</div>
        <div className="pl-sum-val" style={{ color: 'var(--amber)' }}>{monitor}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Elevated risk</div>
      </div>
      <div className="pl-sum-card">
        <div className="section-label">Alert</div>
        <div className="pl-sum-val" style={{ color: 'var(--red)' }}>{alert}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Needs attention</div>
      </div>
    </div>
  )
}

// ── Table row for one patient ────────────────────────
function PatientRow({ patient, onViewClick, onRemoveClick }) {
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
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{patient.email}</div>
          </div>
        </div>
      </td>

      <td>{patient.age} / {patient.sex}</td>
      <td>Day {patient.day}</td>
      <td style={{ fontWeight: 700, color: streakColor }}>{patient.streakLabel}</td>
      <td>{patient.lastMood}</td>

      {/* Trigger pill */}
      <td>
        <span className={`tag-pill${patient.triggerLevel === 'high' ? ' tag-pill-high' : ''}`}>
          {patient.topTrigger}
        </span>
      </td>

      {/* Risk score  */}
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
        <button className="btn-view" onClick={() => onViewClick(patient.id)}>View</button>
        <button
          className="btn-view"
          style={{ marginLeft: 8, color: 'var(--red)', borderColor: 'var(--red)' }}
          onClick={() => onRemoveClick(patient.id, patient.name)}
        >
          Remove
        </button>
      </td>
    </tr>
  )
}

// ── Main Page Component ───────────────────────────────────────
function PatientListPage({ patientsList = [], onViewPatient, onRemovePatient }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchTerm,   setSearchTerm  ] = useState('')

  const [isAdding, setIsAdding] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [addStatus, setAddStatus] = useState({ loading: false, error: '', success: '' })

  const [removingPatient, setRemovingPatient] = useState(null)

  function handleAddPatient() {
    if (!addEmail.trim()) return
    setAddStatus({ loading: true, error: '', success: '' })
    api.requestPatient(addEmail)
      .then(() => {
        setAddStatus({ loading: false, error: '', success: 'Connection request sent successfully.' })
        setAddEmail('')
        setTimeout(() => { setIsAdding(false); setAddStatus({ loading: false, error: '', success: '' }) }, 2000)
      })
      .catch(err => setAddStatus({ loading: false, error: err.message || 'Failed to send request.', success: '' }))
  }

  function handleRemoveClick(patientId, patientName) {
    setRemovingPatient({ id: patientId, name: patientName })
  }

  const filtered = patientsList.filter((p) => {
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

      <SummaryCards patientsList={patientsList} />

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
        <div style={{ flex: 1 }} />
        <button className="btn-reply" onClick={() => setIsAdding(true)}>+ Add Patient</button>
      </div>

      {/* Add Patient Modal */}
      {isAdding && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Connect to Patient</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter the patient's email address to send a monitoring request. They must approve it in their app.</div>
            <input
              className="search-input"
              style={{ margin: 0, width: '100%' }}
              placeholder="patient@example.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
            />
            {addStatus.error && <div style={{ color: 'var(--red)', fontSize: 12 }}>{addStatus.error}</div>}
            {addStatus.success && <div style={{ color: 'var(--green)', fontSize: 12 }}>{addStatus.success}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button className="btn-view" onClick={() => setIsAdding(false)} disabled={addStatus.loading}>Cancel</button>
              <button className="btn-reply" onClick={handleAddPatient} disabled={!addEmail.trim() || addStatus.loading}>
                {addStatus.loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Patient Modal */}
      {removingPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--red)' }}>Remove Patient</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Are you sure you want to remove <strong>{removingPatient.name}</strong> from your monitoring list? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button className="btn-view" onClick={() => setRemovingPatient(null)}>Cancel</button>
              <button
                className="btn-reply"
                style={{ backgroundColor: 'var(--red)', borderColor: 'var(--red)', color: '#fff' }}
                onClick={() => {
                  onRemovePatient(removingPatient.id)
                  setRemovingPatient(null)
                }}
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="patient-table">
          <thead style={{ background: 'var(--surface-2)' }}>
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
            {filtered.map((p) => (
              <PatientRow key={p.id} patient={p} onViewClick={onViewPatient} onRemoveClick={handleRemoveClick} />
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>
        Showing {filtered.length} of {patientsList.length} patients
      </div>
    </div>
  )
}

export default PatientListPage