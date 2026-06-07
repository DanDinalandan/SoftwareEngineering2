import { useState } from 'react'
import logo from '../assets/logo.png'

export default function LoginPage({ onLogin, onGoToSignup }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')

  const handleSubmit = (e) => {
    e.preventDefault() // Prevents page reload
    
    if (!email || !password) {
      setError('Error: Please fill in all required fields.')
      return
    }
    if (password.length < 6) {
      setError('Invalid Transaction: Password must be at least 6 characters.')
      return
    }

    setError('')
    onLogin({ name: 'Louise Reyes', email: email })
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">

        <img 
          src={logo} 
          alt="UNVAPEIFY" 
          style={{ 
          width: '120px',
          height: 'auto', 
          display: 'block', 
          margin: '0 auto 8px' 
          }} 
/>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--text-dark)', fontSize: '28px', fontWeight: 800 }}>UNVAPEIFY</h2>
        <p style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Provider Portal Login</p>

        {/* Displays the red error box if validation fails */}
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <div className="field-label">Email Address</div>
            <input
              type="email"
              className="field-input"
              placeholder="nurse@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field-group">
            <div className="field-label">Password</div>
            <input
              type="password"
              className="field-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-save" style={{ width: '100%', marginTop: '16px', fontSize: '15px' }}>
            Sign In
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span onClick={onGoToSignup} style={{ color: 'var(--bg-highlight)', cursor: 'pointer', fontWeight: 700 }}>
            Sign up here
          </span>
        </div>

      </div>
    </div>
  )
}