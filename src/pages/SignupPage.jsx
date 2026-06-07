import { useState } from 'react'

export default function SignupPage({ onSignup, onGoToLogin }) {
  const [licenseId,   setLicenseId]   = useState('')
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [middleName,  setMiddleName]  = useState('')
  const [suffix,      setSuffix]      = useState('')
  const [gender,      setGender]      = useState('')
  const [dob,         setDob]         = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [error,       setError]       = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!licenseId || !firstName || !lastName || !gender || !dob || !email || !password || !confirmPass) {
      setError('Error: All fields marked with an asterisk (*) are required.')
      return
    }
    if (password !== confirmPass) {
      setError('Invalid Transaction: Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Security Error: Password must be at least 8 characters.')
      return
    }

    setError('')

    onSignup({
      name:       `${firstName} ${lastName}`,
      email,
      license:    licenseId,
      department: '',
      phone:      '',
    })
  }

  const RequiredMark = () => <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>

  return (
    <div className="auth-container" style={{ padding: '40px 0' }}>
      <div className="card auth-card" style={{ maxWidth: '500px' }}>

        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: 'var(--text-dark)', fontSize: '24px', fontWeight: 700 }}>Create Account</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>

          <div className="field-group">
            <div className="field-label">License ID <RequiredMark /></div>
            <input type="text" className="field-input" placeholder="e.g. RN-2024-001"
              value={licenseId} onChange={(e) => setLicenseId(e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field-group">
              <div className="field-label">First Name <RequiredMark /></div>
              <input type="text" className="field-input" placeholder="e.g. Jane"
                value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="field-group">
              <div className="field-label">Last Name <RequiredMark /></div>
              <input type="text" className="field-input" placeholder="e.g. Doe"
                value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <div className="field-label">Middle Name</div>
              <input type="text" className="field-input" placeholder="Optional"
                value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="field-group">
              <div className="field-label">Suffix</div>
              <input type="text" className="field-input" placeholder="e.g. Jr, III (Optional)"
                value={suffix} onChange={(e) => setSuffix(e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field-group">
              <div className="field-label">Gender <RequiredMark /></div>
              <select className="field-input" value={gender} onChange={(e) => setGender(e.target.value)}
                style={{ color: gender ? 'var(--text-dark)' : 'rgba(107, 114, 128, 0.6)' }}>
                <option value="" disabled>Select Gender</option>
                <option value="Female" style={{ color: '#000' }}>Female</option>
                <option value="Male"   style={{ color: '#000' }}>Male</option>
                <option value="Prefer not to say" style={{ color: '#000' }}>Prefer not to say</option>
              </select>
            </div>
            <div className="field-group">
              <div className="field-label">Date of Birth <RequiredMark /></div>
              <input type="date" className="field-input" value={dob} onChange={(e) => setDob(e.target.value)}
                style={{ color: dob ? 'var(--text-dark)' : 'rgba(107, 114, 128, 0.6)' }} />
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">Email Address <RequiredMark /></div>
            <input type="email" className="field-input" placeholder="nurse@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field-group">
              <div className="field-label">Password <RequiredMark /></div>
              <input type="password" className="field-input" placeholder="8+ characters"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="field-group">
              <div className="field-label">Confirm Password <RequiredMark /></div>
              <input type="password" className="field-input" placeholder="Repeat password"
                value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn-save" style={{ width: '100%', marginTop: '16px', fontSize: '15px' }}>
            Register Profile
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <span onClick={onGoToLogin} style={{ color: 'var(--bg-highlight)', cursor: 'pointer', fontWeight: 700 }}>
            Sign in
          </span>
        </div>

      </div>
    </div>
  )
} 