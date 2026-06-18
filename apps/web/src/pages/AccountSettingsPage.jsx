import { useState } from 'react'
import { prefToggles } from '../data/displayOptions.js'
import { api } from '../services/api.js'

// ── Toggle switch component ───────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      className={`toggle-btn ${on ? 'on' : 'off'}`}
      onClick={() => onChange(!on)}
      aria-label="Toggle preference"
    />
  )
}

// ── Profile card (left column) ────────────────────────────────
function ProfileCard({ nurse, onNurseUpdate }) {
  const [form, setForm] = useState({
    firstName: nurse?.firstName || nurse?.name?.split(' ')?.[0] || '',
    lastName: nurse?.lastName || nurse?.name?.split(' ')?.slice(1).join(' ') || '',
    department: nurse?.department || '',
    phone: nurse?.phone || '',
  })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  function saveProfile() {
    setStatus('')
    setError('')
    api.updateNurseProfile(form)
      .then((provider) => {
        onNurseUpdate?.(provider)
        setStatus('Profile saved.')
      })
      .catch((err) => setError(err.message || 'Unable to save profile.'))
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="settings-title">Profile</div>

      <div className="profile-avatar-big">
        <svg width="50" height="50" fill="none" stroke="var(--border-accent)" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <button className="change-photo-btn">Change Photo</button>

      <div className="field-group">
        <div className="field-label">Full name</div>
          <input className="field-input" type="text" value={`${form.firstName} ${form.lastName}`.trim()} onChange={(e) => {
            const [firstName, ...rest] = e.target.value.split(' ')
            setForm((prev) => ({ ...prev, firstName, lastName: rest.join(' ') }))
          }} />
      </div>

      <div className="field-row">
        <div className="field-group">
          <div className="field-label">License No.</div>
          <input className="field-input" type="text" defaultValue={nurse?.license ?? ''} />
        </div>
        <div className="field-group">
          <div className="field-label">Department</div>
          <input className="field-input" type="text" value={form.department} onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))} />
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Email address</div>
        <input className="field-input" type="email" defaultValue={nurse?.email ?? ''} />
      </div>

      <div className="field-group">
        <div className="field-label">Phone</div>
        <input className="field-input" type="text" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {status && <div style={{ color: 'var(--green)', fontSize: 12, marginBottom: 8 }}>{status}</div>}
      <button className="btn-save" onClick={saveProfile}>Save Profile</button>
    </div>
  )
}

// ── Security card (left column) ───────────────────────────────
function SecurityCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  function updatePassword() {
    setStatus('')
    setError('')
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.')
      return
    }
    api.changeProviderPassword(form)
      .then(() => {
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setStatus('Password updated.')
      })
      .catch((err) => setError(err.message || 'Unable to update password.'))
  }

  return (
    <div className="card">
      <div className="settings-title">Security</div>

      <div className="field-group">
        <div className="field-label">Current password</div>
        <input className="field-input" type="password" value={form.currentPassword} onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
      </div>
      <div className="field-group">
        <div className="field-label">New password</div>
        <input className="field-input" type="password" value={form.newPassword} onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
      </div>
      <div className="field-group">
        <div className="field-label">Confirm new password</div>
        <input className="field-input" type="password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
      </div>
      {error && <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      {status && <div style={{ color: 'var(--green)', fontSize: 12, marginBottom: 8 }}>{status}</div>}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn-save" onClick={updatePassword}>Update Password</button>
        <button className="btn-danger">Sign Out All Devices</button>
      </div>
    </div>
  )
}

// ── Notification preferences card (right column) ──────────────
function NotifPrefsCard({ nurse, onNurseUpdate }) {
  const defaults = {
    highRiskAlerts: true,
    dailyReports: true,
    patientMessages: true,
    connectionRequests: true,
  }
  const [prefs, setPrefs] = useState({ ...defaults, ...(nurse?.notificationPreferences || {}) })
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const keys = ['highRiskAlerts', 'dailyReports', 'patientMessages', 'connectionRequests']

  function savePreferences() {
    setStatus('')
    setError('')
    api.updateNotificationPreferences(prefs)
      .then((provider) => {
        onNurseUpdate?.(provider)
        setStatus('Preferences saved.')
      })
      .catch((err) => setError(err.message || 'Unable to save preferences.'))
  }

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="settings-title">Notification Preferences</div>

      {prefToggles.map(({ label, sub, defaultOn }, index) => {
        const key = keys[index] || label.replace(/\W+/g, '')
        const on = prefs[key] ?? defaultOn
        return (
        <div key={label} className="pref-row">
          <div>
            <div className="pref-label">{label}</div>
            <div className="pref-sub">{sub}</div>
          </div>
          <Toggle on={on} onChange={(next) => setPrefs((prev) => ({ ...prev, [key]: next }))} />
        </div>
        )
      })}

      {error && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{error}</div>}
      {status && <div style={{ color: 'var(--green)', fontSize: 12, marginTop: 8 }}>{status}</div>}
      <button className="btn-save" style={{ marginTop: 16 }} onClick={savePreferences}>Save Preferences</button>
    </div>
  )
}

// ── Recent activity card (right column) ──────────────────────
function ActivityCard() {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="settings-title">Recent Activity</div>
      <div className="act-row">
        <div className="act-icon">📋</div>
        <div className="act-text">Recent provider activity will appear after audit logging is enabled.</div>
        <div className="act-time">Live</div>
      </div>
    </div>
  )
}

// ── Session management card (right column) ───────────────────────────
function SignOutCard({ onLogout }) {
  return (
    <div className="card">
      <div className="settings-title">Session</div>
      <button
        onClick={onLogout}
        style={{
          width: '100%',
          background: 'rgba(187,127,226,0.15)',
          border: '1px solid rgba(187,127,226,0.4)',
          color: '#BB7FE2',
          padding: '12px 28px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>
    </div>
  )
}

// ── Main Page Component ───────────────────────────────────────
function AccountSettingsPage({ onLogout, nurse, onNurseUpdate }) {
  return (
    <div>
      <div className="settings-grid">
        <div>
          <ProfileCard nurse={nurse} onNurseUpdate={onNurseUpdate} />
          <SecurityCard />
        </div>
        <div>
          <NotifPrefsCard nurse={nurse} onNurseUpdate={onNurseUpdate} />
          <ActivityCard />
          <SignOutCard onLogout={onLogout} />
        </div>
      </div>
    </div>
  )
}

export default AccountSettingsPage
