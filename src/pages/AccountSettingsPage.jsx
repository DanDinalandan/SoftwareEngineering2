import { useState } from 'react'
import { activityLog, prefToggles } from '../data/mockData.js'

// ── Toggle switch component ───────────────────────────────────
function Toggle({ defaultOn }) {
  const [on, setOn] = useState(defaultOn)

  return (
    <button
      className={`toggle-btn ${on ? 'on' : 'off'}`}
      onClick={() => setOn(!on)}
      aria-label="Toggle preference"
    />
  )
}

// ── Profile card (left column) ────────────────────────────────
function ProfileCard() {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="settings-title">Profile</div>

      {/* Avatar placeholder */}
      <div className="profile-avatar-big">
        <svg width="50" height="50" fill="none" stroke="var(--text-light)" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <button className="change-photo-btn">Change Photo</button>

      {/* Text fields */}
      <div className="field-group">
        <div className="field-label">Full name</div>
        <input className="field-input" type="text" defaultValue="Name Surname" />
      </div>

      {/* Two fields side by side */}
      <div className="field-row">
        <div className="field-group">
          <div className="field-label">License No.</div>
          <input className="field-input" type="text" defaultValue="RN-2024-001" />
        </div>
        <div className="field-group">
          <div className="field-label">Department</div>
          <input className="field-input" type="text" defaultValue="Cessation Clinic" />
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Email address</div>
        <input className="field-input" type="email" defaultValue="nurse@email.com" />
      </div>

      <div className="field-group">
        <div className="field-label">Phone</div>
        <input className="field-input" type="text" defaultValue="+63 912 345 6789" />
      </div>

      <button className="btn-save">Save Profile</button>
    </div>
  )
}

// ── Security card (left column) ───────────────────────────────
function SecurityCard() {
  const fields = ['Current password', 'New password', 'Confirm new password']

  return (
    <div className="card">
      <div className="settings-title">Security</div>

      {fields.map((label) => (
        <div key={label} className="field-group">
          <div className="field-label">{label}</div>
          <input
            className="field-input"
            type="password"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn-save">Update Password</button>
        <button className="btn-danger">Sign Out All Devices</button>
      </div>
    </div>
  )
}

// ── Notification preferences card (right column) ──────────────
function NotifPrefsCard() {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="settings-title">Notification Preferences</div>

      {prefToggles.map(({ label, sub, defaultOn }) => (
        <div key={label} className="pref-row">
          <div>
            <div className="pref-label">{label}</div>
            <div className="pref-sub">{sub}</div>
          </div>
          <Toggle defaultOn={defaultOn} />
        </div>
      ))}

      <button className="btn-save" style={{ marginTop: 16 }}>Save Preferences</button>
    </div>
  )
}

// ── Recent activity card (right column) ──────────────────────
function ActivityCard() {
  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div className="settings-title">Recent Activity</div>
      {activityLog.map(({ icon, text, time }) => (
        <div key={text} className="act-row">
          <div className="act-icon">{icon}</div>
          <div className="act-text">{text}</div>
          <div className="act-time">{time}</div>
        </div>
      ))}
    </div>
  )
}

// ── Danger zone card (right column) ───────────────────────────
function DangerZoneCard() {
  return (
    <div className="card">
      <div className="settings-title">Danger Zone</div>
      <p style={{ fontSize: 13, color: 'var(--bg-canvas)', marginBottom: 16, lineHeight: 1.7 }}>
        Permanently delete your account and all associated patient data.
        This action cannot be undone and will revoke all monitoring access immediately.
      </p>
      <button className="btn-danger" style={{ width: '100%' }}>Delete Account</button>
    </div>
  )
}

// ── Main Page Component ───────────────────────────────────────
function AccountSettingsPage() {
  return (
    <div>

      <div className="settings-grid">
        
        {/* Left column */}
        <div>
          <ProfileCard />
          <SecurityCard />
        </div>

        {/* Right column */}
        <div>
          <NotifPrefsCard />
          <ActivityCard />
          <DangerZoneCard />
        </div>
      </div>
    </div>
  )
}

export default AccountSettingsPage
