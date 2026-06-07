import { useState } from 'react'
import { messages } from '../data/mockData.js'

export default function MessagesPage() {
  const [activeMsgId, setActiveMsgId] = useState(messages[0].id)

  const activeMsg = messages.find(m => m.id === activeMsgId)

  return (
    <div className="inbox-container">
      
      {/* LEFT COLUMN: MESSAGE LIST */}
      <div className="inbox-sidebar">
        <div className="inbox-header-title">INBOX</div>
        
        <div className="inbox-list">
          {messages.map((msg) => {
            const isActive = msg.id === activeMsgId;
            return (
              <div 
                key={msg.id} 
                className={`inbox-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveMsgId(msg.id)}
              >
                <div className="inbox-item-avatar">
                  {/* Placeholder Avatar - Replace with actual image/icon if needed */}
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                
                <div className="inbox-item-content">
                  <div className="inbox-item-top">
                    <span className="inbox-sender">{msg.patientName}</span>
                    <span className="inbox-time">{msg.time}</span>
                  </div>
                  <div className="inbox-subject">{msg.subject}</div>
                  <div className="inbox-snippet">{msg.preview}</div>
                </div>

                {msg.unread && <div className="inbox-unread-dot"></div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: MESSAGE READING PANE */}
      <div className="inbox-reading-pane">
        
        <div className="reading-header">
          <h1 className="reading-subject">{activeMsg.subject}</h1>
          <div className="reading-sender-info">
            <div className="reading-avatar">
               <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
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
          ></textarea>
          <button className="btn-reply">Send Reply</button>
        </div>

      </div>
    </div>
  )
}