import { useState } from 'react'
import logo from '../assets/logo.png'
import { api } from '../services/api.js'

export default function LoginPage({ onLogin, onGoToSignup }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState({ loading: false, error: '', success: false })

  const handleForgotPassword = (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      setForgotStatus({ loading: false, error: 'Please enter your email address.', success: false })
      return
    }
    
    setForgotStatus({ loading: true, error: '', success: false })
    
    setTimeout(() => {
      setForgotStatus({ loading: false, error: '', success: true })
      setTimeout(() => {
        setShowForgotModal(false)
        setForgotEmail('')
        setForgotStatus({ loading: false, error: '', success: false })
      }, 3000)
    }, 1500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Error: Please fill in all required fields.')
      return
    }
    if (password.length < 6) {
      setError('Invalid Transaction: Password must be at least 6 characters.')
      return
    }

    setError('')
    setIsLoading(true)
    try {
      const nurseData = await api.loginProvider({ email, password })
      onLogin(nurseData)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="card auth-card">

        <img
          src={logo}
          alt="UNVAPEIFY"
          style={{ width: '120px', height: 'auto', display: 'block', margin: '0 auto 8px' }}
        />
        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: 'var(--text-dark)', fontSize: '28px', fontWeight: 800 }}>UNVAPEIFY</h2>
        <p style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Provider Portal Login</p>

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

          <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '16px' }}>
            <span 
              onClick={() => {
                setShowForgotModal(true)
                setForgotEmail(email)
              }} 
              style={{ color: 'var(--bg-highlight)', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
            >
              Forgot password?
            </span>
          </div>

          <button
            type="submit"
            className="btn-save"
            style={{ width: '100%', marginTop: '16px', fontSize: '15px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span onClick={onGoToSignup} style={{ color: 'var(--bg-highlight)', cursor: 'pointer', fontWeight: 700 }}>
            Sign up here
          </span>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: 'var(--text-dark)' }}>Reset Password</h2>
            
            {forgotStatus.success ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✉️</div>
                <div style={{ color: 'var(--green)', fontSize: 14, fontWeight: 600 }}>Reset link sent!</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>Check your inbox for further instructions.</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Enter your provider email address and we will send you a link to reset your password.</div>
                
                <input
                  type="email"
                  className="field-input"
                  style={{ margin: 0, width: '100%' }}
                  placeholder="nurse@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={forgotStatus.loading}
                />
                
                {forgotStatus.error && <div style={{ color: 'var(--red)', fontSize: 12 }}>{forgotStatus.error}</div>}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                  <button 
                    className="btn-view" 
                    onClick={() => {
                      setShowForgotModal(false)
                      setForgotStatus({ loading: false, error: '', success: false })
                    }} 
                    disabled={forgotStatus.loading}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-save" 
                    onClick={handleForgotPassword} 
                    disabled={!forgotEmail.trim() || forgotStatus.loading}
                  >
                    {forgotStatus.loading ? 'Sending...' : 'Send Link'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
