import { useState } from 'react'
import { notifications } from '../data/mockData.js'

const FILTERS = ['All', 'Alerts', 'Updates', 'Milestones']

const FILTER_FNS = {
  All:        () => true,
  Alerts:     (n) => n.type === 'alert',
  Updates:    (n) => n.type === 'info' || n.type === 'warning',
  Milestones: (n) => n.type === 'success',
}

// ─── Component ───────────────────────────────────────────────
function NotificationsPanel({ isOpen, onClose }) {
  const [activeFilter, setActiveFilter] = useState('All')
  const visible = notifications.filter(FILTER_FNS[activeFilter])

  return (
    <div className={`notif-overlay${isOpen ? ' open' : ''}`}>

      {/* Header row */}
      <div className="np-header">
        <h2>Notifications</h2>
        <button className="np-close" onClick={onClose}>✕</button>
      </div>

      {/* Filter tabs */}
      <div className="np-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`nf-btn${activeFilter === f ? ' active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Scrollable list */}
      <div className="np-list">
        {visible.map((n) => (
          <div key={n.id} className={`notif-item ${n.type}`}>

            {/* Coloured icon */}
            <div className={`notif-icon ${n.type}`}>{n.icon}</div>

            {/* Text content */}
            <div className="notif-body">
              <div className="notif-title">{n.title}</div>
              <div className="notif-desc">{n.desc}</div>
              <div className="notif-time">{n.time}</div>
            </div>

            {/* Unread red dot — only renders if n.unread is true */}
            {n.unread && <div className="notif-unread" />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotificationsPanel
