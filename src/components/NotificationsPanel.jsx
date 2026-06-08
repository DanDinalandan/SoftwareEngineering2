import { useState, useEffect } from 'react'
import { api } from '../services/api.js'
import { notificationFilters } from '../data/mockData.js'

// ── Component ─────────────────────────────────────────────────
function NotificationsPanel({ isOpen, onClose, onUnreadCountChange }) {
  const [notifList,    setNotifList]    = useState([])
  const [activeFilter, setActiveFilter] = useState('All')
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    api.getNotifications()
      .then((data) => {
        setNotifList(data)
        onUnreadCountChange?.(data.filter(n => n.unread).length)
      })
      .catch((err) => console.error('Failed to load notifications:', err))
      .finally(() => setIsLoading(false))
  }, [])

  function handleNotifClick(id) {
    const already = notifList.find(n => n.id === id)
    if (!already?.unread) return  // already read — no-op

    api.markNotificationRead(id)
      .then(() => {
        const updated = notifList.map(n => n.id === id ? { ...n, unread: false } : n)
        setNotifList(updated)
        onUnreadCountChange?.(updated.filter(n => n.unread).length)
      })
      .catch((err) => console.error('Failed to mark notification read:', err))
  }

  function handleMarkAllRead() {
    const hasUnread = notifList.some(n => n.unread)
    if (!hasUnread) return

    api.markAllNotificationsRead()
      .then(() => {
        const updated = notifList.map(n => ({ ...n, unread: false }))
        setNotifList(updated)
        onUnreadCountChange?.(0)
      })
      .catch((err) => console.error('Failed to mark all read:', err))
  }

  const filterFn  = notificationFilters.find(f => f.label === activeFilter)?.fn ?? (() => true)
  const visible   = notifList.filter(filterFn)
  const unreadCount = notifList.filter(n => n.unread).length

  return (
    <div className={`notif-overlay${isOpen ? ' open' : ''}`}>

      {/* ── Header ── */}
      <div className="np-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="np-unread-badge">{unreadCount}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {unreadCount > 0 && (
            <button className="np-mark-all-btn" onClick={handleMarkAllRead}>
              Mark all read
            </button>
          )}
          <button className="np-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="np-filters">
        {notificationFilters.map((f) => (
          <button
            key={f.label}
            className={`nf-btn${activeFilter === f.label ? ' active' : ''}`}
            onClick={() => setActiveFilter(f.label)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Scrollable list ── */}
      <div className="np-list">
        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Loading notifications...
          </div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No notifications in this category.
          </div>
        ) : (
          visible.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.type}${n.unread ? ' unread-item' : ''}`}
              onClick={() => handleNotifClick(n.id)}
              style={{ cursor: n.unread ? 'pointer' : 'default' }}
            >
              <div className={`notif-icon ${n.type}`}>{n.icon}</div>

              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-desc">{n.desc}</div>
                <div className="notif-time">{n.time}</div>
              </div>

              {n.unread && <div className="notif-unread" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationsPanel