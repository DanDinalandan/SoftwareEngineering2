import { useState } from 'react'
import { messages } from '../data/mockData.js'

function InboxList({ selectedId, onSelect }) {
  return (
    <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid rgba(139,107,80,0.3)', overflowY: 'auto' }}>
      {/* Inbox header */}
      <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid rgba(139,107,80,0.3)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--bg-canvas)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Inbox</div>
      </div>

      {/* Message rows */}
      {messages.map((msg) => {
        const isSelected = selectedId === msg.id
        return (
          <button
            key={msg.id}
            onClick={() => onSelect(msg.id)}
            style={{
              width: '100%', display: 'flex', gap: 12, padding: '14px 20px',
              background: isSelected ? 'rgba(248,238,228,0.1)' : 'transparent',
              borderLeft: isSelected ? '3px solid var(--border-yellow)' : '3px solid transparent',
              border: 'none', borderBottom: '1px solid rgba(139,107,80,0.2)',
              cursor: 'pointer', textAlign: 'left', alignItems: 'flex-start',
            }}
          >
            {/* Avatar */}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-tag)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, marginTop: 2 }}>
              {msg.patientEmoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name + time row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 13, fontWeight: msg.unread ? 700 : 500, color: 'var(--text-light)' }}>
                  {msg.patientName}
                </span>
                <span style={{ fontSize: 10, color: 'var(--bg-canvas)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                  {msg.time}
                </span>
              </div>
              {/* Subject */}
              <div style={{ fontSize: 12, fontWeight: msg.unread ? 600 : 400, color: msg.unread ? 'var(--text-light)' : 'var(--bg-canvas)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {msg.subject}
              </div>
              {/* Preview */}
              <div style={{ fontSize: 11, color: 'var(--bg-canvas)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>
                {msg.preview}
              </div>
            </div>
            {/* Unread dot */}
            {msg.unread && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', flexShrink: 0, marginTop: 6 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function MessageDetail({ message, onReply, replyText, onReplyChange }) {
  if (!message) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-canvas)', fontSize: 14 }}>
        Select a message to read it
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Message header */}
      <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid rgba(139,107,80,0.3)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-light)', marginBottom: 12 }}>
          {message.subject}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-tag)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {message.patientEmoji}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)' }}>{message.patientName}</div>
            <div style={{ fontSize: 11, color: 'var(--bg-canvas)' }}>Patient · {message.time}</div>
          </div>
        </div>
      </div>

      {/* Message body */}
      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        <div style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
          {message.body}
        </div>
      </div>

      {/* Reply box */}
      <div style={{ padding: '16px 28px 24px', borderTop: '1px solid rgba(139,107,80,0.3)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--bg-canvas)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Reply to {message.patientName}
        </div>
        <textarea
          value={replyText}
          onChange={(e) => onReplyChange(e.target.value)}
          placeholder="Write your reply here..."
          rows={4}
          style={{
            width: '100%', background: 'var(--bg-inactive)', border: '1px solid rgba(139,107,80,0.5)',
            borderRadius: 12, padding: '12px 14px', color: 'var(--text-light)', fontSize: 13,
            resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button
            onClick={onReply}
            style={{
              background: 'var(--bg-highlight)', border: 'none', color: 'var(--text-light)',
              padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Send Reply
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Messages Page ────────────────────────────────────────
export default function MessagesPage() {
  const [selectedId, setSelectedId]   = useState(messages[0]?.id ?? null)
  const [replyText,  setReplyText]    = useState('')
  const [sent,       setSent]         = useState(false)

  const selectedMessage = messages.find(m => m.id === selectedId) ?? null

  function handleReply() {
    if (!replyText.trim()) return
    setSent(true)
    setReplyText('')
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div>

      {/* Two-panel layout: inbox list | message detail */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', height: 'calc(100vh - 140px)', minHeight: 500 }}>
        <InboxList selectedId={selectedId} onSelect={setSelectedId} />
        <MessageDetail
          message={selectedMessage}
          replyText={replyText}
          onReplyChange={setReplyText}
          onReply={handleReply}
        />
      </div>
    </div>
  )
}