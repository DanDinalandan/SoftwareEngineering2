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
        <svg width="50" height="50" fill="none" stroke="var(--border-accent)" strokeWidth="2" viewBox="0 0 24 24">
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
function AccountSettingsPage({ onLogout }) {
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
          <SignOutCard onLogout={onLogout} />
        </div>
      </div>
    </div>
  )
}

export default AccountSettingsPage