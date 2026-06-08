import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

export default function MessagesPage({ onUnreadChange }) {
  const [messagesList, setMessagesList] = useState([])
  const [activeMsgId,  setActiveMsgId]  = useState(null)
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    api.getMessages()
      .then((data) => {
        setMessagesList(data)
        if (data.length > 0) setActiveMsgId(data[0].id)
      })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => setIsLoading(false))
  }, [])

  function handleSelectMessage(id) {
    setActiveMsgId(id)
    const msg = messagesList.find(m => m.id === id)
    if (!msg?.unread) return

    api.markMessageRead(id)
      .then(() => {
        setMessagesList(prev =>
          prev.map(m => m.id === id ? { ...m, unread: false } : m)
        )
        if (onUnreadChange) onUnreadChange(prev => Math.max(0, prev - 1))
      })
      .catch((err) => console.error('Failed to mark message read:', err))
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading messages...
      </div>
    )
  }

  const activeMsg   = messagesList.find(m => m.id === activeMsgId)
  const unreadCount = messagesList.filter(m => m.unread).length

  return (
    <div className="inbox-container">

      {/* LEFT COLUMN: MESSAGE LIST */}
      <div className="inbox-sidebar">
        <div className="inbox-header-row">
          <div className="inbox-header-title">INBOX</div>
          {unreadCount > 0 && (
            <span className="inbox-unread-badge">{unreadCount}</span>
          )}
        </div>

        <div className="inbox-list">
          {messagesList.map((msg) => {
            const isActive = msg.id === activeMsgId
            return (
              <div
                key={msg.id}
                className={`inbox-item ${isActive ? 'active' : ''} ${msg.unread ? 'inbox-item-unread' : ''}`}
                onClick={() => handleSelectMessage(msg.id)}
              >
                <div className="inbox-item-avatar">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                <div className="inbox-item-content">
                  <div className="inbox-item-top">
                    <span className={`inbox-sender ${msg.unread ? 'inbox-sender-unread' : ''}`}>{msg.patientName}</span>
                    <span className="inbox-time">{msg.time}</span>
                  </div>
                  <div className={`inbox-subject ${msg.unread ? 'inbox-subject-unread' : ''}`}>{msg.subject}</div>
                  <div className="inbox-snippet">{msg.preview}</div>
                </div>

                {msg.unread && <div className="inbox-unread-dot" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      {activeMsg && (
        <div className="inbox-reading-pane">
          <div className="reading-header">
            <h1 className="reading-subject">{activeMsg.subject}</h1>
            <div className="reading-sender-info">
              <div className="reading-avatar">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <div className="reading-name">{activeMsg.patientName}</div>
                <div className="reading-meta">Patient · {activeMsg.time}</div>
              </div>
            </div>
          </div>

          <div className="reading-body">
            {activeMsg.body.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="reading-reply-box">
            <div className="reply-label">REPLY TO {activeMsg.patientName.toUpperCase()}</div>
            <textarea className="reply-input" placeholder="Write your reply here..." />
            <button className="btn-reply">Send Reply</button>
          </div>
        </div>
      )}
    </div>
  )
}