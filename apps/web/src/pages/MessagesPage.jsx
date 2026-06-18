import { useState, useEffect } from 'react'
import { api } from '../services/api.js'

export default function MessagesPage({ onUnreadChange, patientsList = [] }) {
  const [messagesList, setMessagesList] = useState([])
  const [activeMsgId,  setActiveMsgId]  = useState(null)
  const [isLoading,    setIsLoading]    = useState(true)
  const [activeTab,    setActiveTab]    = useState('inbox') 

  const [replyText,  setReplyText]  = useState('')
  const [isSending,  setIsSending]  = useState(false)
  const [sentStatus, setSentStatus] = useState(false)

  const [isComposing, setIsComposing] = useState(false)
  const [composeForm, setComposeForm] = useState({ patientId: '', subject: '', body: '' })
  const [isCreating,  setIsCreating]  = useState(false)

  const [isEditing,    setIsEditing]    = useState(false)
  const [editForm,     setEditForm]     = useState({ subject: '', body: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [isDeleting,   setIsDeleting]   = useState(false)

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
    setIsComposing(false)
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
    setIsEditing(false)
  }, [activeMsgId])

  const displayedMessages = messagesList.filter(m =>
    activeTab === 'sent' ? m.senderType === 'provider' : m.senderType !== 'provider'
  )

  useEffect(() => {
    if (displayedMessages.length > 0 && !displayedMessages.find(m => m.id === activeMsgId)) {
      setActiveMsgId(displayedMessages[0].id)
    } else if (displayedMessages.length === 0) {
      setActiveMsgId(null)
    }
  }, [activeTab, messagesList])

  function handleOpenCompose() {
    setComposeForm({ patientId: patientsList[0]?.id ?? '', subject: '', body: '' })
    setIsComposing(true)
  }

  function handleCreateMessage() {
    if (!composeForm.patientId || !composeForm.subject.trim() || !composeForm.body.trim()) return
    setIsCreating(true)
    api.composeMessage(composeForm)
      .then((newMsg) => {
        setMessagesList(prev => [newMsg, ...prev])
        setActiveMsgId(newMsg.id)
        setIsComposing(false)
      })
      .catch((err) => console.error('Failed to create message:', err))
      .finally(() => setIsCreating(false))
  }

  function handleStartEdit() {
    const msg = messagesList.find(m => m.id === activeMsgId)
    if (!msg) return
    setEditForm({ subject: msg.subject, body: msg.body })
    setIsEditing(true)
  }

  function handleSaveEdit() {
    if (!editForm.subject.trim() || !editForm.body.trim()) return
    setIsSavingEdit(true)
    api.updateMessage(activeMsgId, editForm)
      .then(() => {
        setMessagesList(prev =>
          prev.map(m => m.id === activeMsgId ? { ...m, subject: editForm.subject, body: editForm.body } : m)
        )
        setIsEditing(false)
      })
      .catch((err) => console.error('Failed to update message:', err))
      .finally(() => setIsSavingEdit(false))
  }

  function handleDeleteMessage() {
    if (!activeMsgId) return
    const confirmed = window.confirm('Delete this message? This cannot be undone.')
    if (!confirmed) return

    const wasUnread = messagesList.find(m => m.id === activeMsgId)?.unread

    setIsDeleting(true)
    api.deleteMessage(activeMsgId)
      .then(() => {
        setMessagesList(prev => {
          const remaining = prev.filter(m => m.id !== activeMsgId)
          setActiveMsgId(remaining.length > 0 ? remaining[0].id : null)
          return remaining
        })
        if (wasUnread && onUnreadChange) onUnreadChange(prev => Math.max(0, prev - 1))
      })
      .catch((err) => console.error('Failed to delete message:', err))
      .finally(() => setIsDeleting(false))
  }

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
        <div className="inbox-header-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="inbox-header-title">MESSAGES</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {unreadCount > 0 && (
                <span className="inbox-unread-badge">{unreadCount}</span>
              )}
              <button className="btn-reply" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleOpenCompose}>
                + New
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>
            <div
              style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', color: activeTab === 'inbox' ? 'var(--lavender)' : 'var(--text-muted)' }}
              onClick={() => { setActiveTab('inbox'); setIsComposing(false); }}
            >
              Inbox
            </div>
            <div
              style={{ fontSize: 12, fontWeight: 700, cursor: 'pointer', color: activeTab === 'sent' ? 'var(--lavender)' : 'var(--text-muted)' }}
              onClick={() => { setActiveTab('sent'); setIsComposing(false); }}
            >
              Sent
            </div>
          </div>
        </div>

        <div className="inbox-list">
          {displayedMessages.length === 0 ? (
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
            displayedMessages.map((msg) => {
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
      {isComposing ? (
        <div className="inbox-reading-pane">
          <div className="reading-header">
            <h1 className="reading-subject">New Message</h1>
          </div>

          <div className="reading-reply-box">
            <div className="reply-label">TO</div>
            <select
              className="reply-input"
              style={{ marginBottom: 10, minHeight: 'auto', padding: '10px 14px', height: '42px', resize: 'none' }}
              value={composeForm.patientId}
              onChange={(e) => setComposeForm(f => ({ ...f, patientId: e.target.value }))}
            >
              {patientsList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <div className="reply-label">SUBJECT</div>
            <input
              className="reply-input"
              style={{ marginBottom: 10, minHeight: 'auto', padding: '10px 14px', height: '42px', resize: 'none' }}
              value={composeForm.subject}
              onChange={(e) => setComposeForm(f => ({ ...f, subject: e.target.value }))}
            />

            <div className="reply-label">MESSAGE</div>
            <textarea
              className="reply-input"
              style={{ minHeight: '160px' }}
              placeholder="Write your message..."
              value={composeForm.body}
              onChange={(e) => setComposeForm(f => ({ ...f, body: e.target.value }))}
              disabled={isCreating}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn-view" onClick={() => setIsComposing(false)}>Cancel</button>
              <button
                className="btn-reply"
                onClick={handleCreateMessage}
                disabled={!composeForm.patientId || !composeForm.subject.trim() || !composeForm.body.trim() || isCreating}
              >
                {isCreating ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      ) : activeMsg ? (
        <div className="inbox-reading-pane">
          <div className="reading-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              {isEditing ? (
                <input
                  className="reply-input"
                  style={{ fontSize: 20, fontWeight: 700, flex: 1 }}
                  value={editForm.subject}
                  onChange={(e) => setEditForm(f => ({ ...f, subject: e.target.value }))}
                />
              ) : (
                <h1 className="reading-subject">{activeMsg.subject}</h1>
              )}

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {isEditing ? (
                  <>
                    <button className="btn-view" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button className="btn-reply" style={{ padding: '6px 12px', fontSize: 12 }} onClick={handleSaveEdit} disabled={isSavingEdit}>
                      {isSavingEdit ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : activeMsg.senderType === 'provider' ? (
                  <>
                    <button className="btn-view" onClick={handleStartEdit}>Edit</button>
                    <button
                      className="btn-view"
                      style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                      onClick={handleDeleteMessage}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>

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
            {isEditing ? (
              <textarea
                className="reply-input"
                style={{ minHeight: 160 }}
                value={editForm.body}
                onChange={(e) => setEditForm(f => ({ ...f, body: e.target.value }))}
              />
            ) : (
              activeMsg.body.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))
            )}
          </div>

          {activeMsg.senderType !== 'provider' && (
            <div className="reading-reply-box">
              <div className="reply-label">REPLY TO {activeMsg.patientName.toUpperCase()}</div>
              <textarea
                className="reply-input"
                style={{ minHeight: '120px' }}
                placeholder="Write your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSending}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
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
          )}
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