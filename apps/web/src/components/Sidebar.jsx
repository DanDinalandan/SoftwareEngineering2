import { useState } from 'react'

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    svgPath: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z',
  },
  {
    key: 'statistics',
    label: 'Statistics',
    svgPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    key: 'patients',
    label: 'Patient List',
    svgPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  },
  {
    key: 'messages',
    label: 'Messages',
    svgPath: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    key: 'account',
    label: 'Account Settings',
    svgPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  },
]

const STATUS_COLOR = { stable: 'var(--green)', monitor: 'var(--amber)', alert: 'var(--red)' }

function Sidebar({ activePage, onNavigate, activePatientId, onSelectPatient, patientsList = [], nurse, unreadCount = 0, unreadMsgCount = 0 }) {
  const [patientsOpen, setPatientsOpen] = useState(true)

  return (
    <aside style={{
      width: 260,
      background: 'var(--bg-sidebar)',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
      position: 'fixed',
      top: 0, bottom: 0, left: 0,
      zIndex: 100,
      overflowY: 'auto',
    }}>

      {/* ── Nurse profile ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 }}>
        <div style={{ width: 64, height: 64, background: 'var(--bg-highlight)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <svg width="40" height="40" fill="none" stroke="var(--text-light)" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div style={{ color: 'var(--text-light)', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {nurse?.name ?? '—'}
        </div>
        <div style={{ color: 'var(--bg-canvas)', fontSize: 11, marginTop: 2 }}>
          {nurse?.email ?? '—'}
        </div>
      </div>

      {/* ── Main nav items ── */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 12px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '10px 12px',
                borderRadius: 10, border: 'none',
                background:  isActive ? 'var(--bg-highlight)' : 'transparent',
                borderLeft:  isActive ? '4px solid var(--text-light)' : '4px solid transparent',
                color: 'var(--text-light)', fontSize: 13, fontWeight: 500,
                textAlign: 'left', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ opacity: 0.9, flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.svgPath} />
                </svg>
                <span>{item.label}</span>
              </div>
              {/* Show live unread badge on the notifications bell nav item */}
              {item.key === 'messages' && unreadMsgCount > 0 && (
                <span style={{ background: '#ec3c3c', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>
                  {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Patient quick-access list ── */}
      <div style={{ padding: '12px 12px 0', marginTop: 4 }}>
        {/* Section header */}
        <button
          onClick={() => setPatientsOpen(o => !o)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px 8px' }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(248,238,228,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            My Patients
          </span>
          {/* Chevron rotates when open */}
          <svg width="14" height="14" fill="none" stroke="rgba(248,238,228,0.45)" strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ transform: patientsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible list */}
        {patientsOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {patientsList.map((p) => {
              const isSelected = activePatientId === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: isSelected ? 'rgba(248,238,228,0.12)' : 'transparent',
                    textAlign: 'left',
                  }}
                >
                  {/* Patient emoji avatar */}
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-tag)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {p.emoji}
                  </div>
                  {/* Name + email */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--bg-canvas)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.email}
                    </div>
                  </div>
                  {/* Status dot */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[p.status] || 'var(--bg-canvas)', flexShrink: 0 }} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar