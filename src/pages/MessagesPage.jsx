import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

export default function MessagesPage({ onUnreadChange }) {
  const [messagesList, setMessagesList] = useState([])
  const [activeMsgId,  setActiveMsgId]  = useState(null)
  const [isLoading,    setIsLoading]    = useState(true)

  const [replyText,  setReplyText]  = useState('')
  const [isSending,  setIsSending]  = useState(false)
  const [sentStatus, setSentStatus] = useState(false)

  useEffect(() => {
    api.getMessages()
      .then((data) => {
        setMessagesList(data)
        if (data.length > 0) setActiveMsgId(data[0].id)

        const realUnread = data.filter(m => m.unread).length
        if (onUnreadChange) onUnreadChange(() => realUnread)
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

  useEffect(() => {
    setReplyText('')
    setSentStatus(false)
  }, [activeMsgId])

  function handleSendReply() {
    if (!replyText.trim()) return
    setIsSending(true)
    setSentStatus(false)
    api.sendMessageReply(activeMsgId, replyText)
      .then(() => {
        setReplyText('')
        setSentStatus(true)
        setTimeout(() => setSentStatus(false), 3500)
      })
      .catch((err) => console.error('Failed to send reply:', err))
      .finally(() => setIsSending(false))
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
          {messagesList.length === 0 ? (
            <div style={{display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              gap: 10,
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}>
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 0.35 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.5 }}>Your inbox is currently empty</div>
              <div style={{ fontSize: 11, opacity: 0.35 }}>Messages from your patients will appear here.</div>
            </div>
          ) : (
            messagesList.map((msg) => {
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
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      {activeMsg ? (
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
            <textarea
              className="reply-input"
              placeholder="Write your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isSending}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
              {sentStatus && (
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>
                  ✓ Reply sent successfully
                </span>
              )}
              <button
                className="btn-reply"
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSending}
                style={{
                  opacity: (!replyText.trim() || isSending) ? 0.5 : 1,
                  cursor: (!replyText.trim() || isSending) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)', opacity: 0.4,
        }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No messages yet</div>
          <div style={{ fontSize: 12 }}>Select a message to read it here.</div>
        </div>
      )}
    </div>
  )
}