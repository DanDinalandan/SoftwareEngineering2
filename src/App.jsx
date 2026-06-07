import { useState, useEffect } from 'react'
import Sidebar             from './components/Sidebar.jsx'
import Header              from './components/Header.jsx'
import NotificationsPanel  from './components/NotificationsPanel.jsx'
import DashboardPage       from './pages/DashboardPage.jsx'
import StatisticsPage      from './pages/StatisticsPage.jsx'
import PatientListPage     from './pages/PatientListPage.jsx'
import AccountSettingsPage from './pages/AccountSettingsPage.jsx'
import MessagesPage        from './pages/MessagesPage.jsx'
import LoginPage           from './pages/LoginPage.jsx'
import SignupPage          from './pages/SignupPage.jsx'
import { api }             from './services/api.js'

export default function App() {
  // ── Auth State ──
  const [nurse, setNurse]           = useState(null)
  const [authScreen, setAuthScreen] = useState('login')

  // ── App Navigation State ──
  const [activePage, setActivePage]               = useState('dashboard')
  const [notifOpen, setNotifOpen]                 = useState(false)
  const [activePatientId, setActivePatientId]     = useState(1)

  // ── Patient Roster State (loaded once after login) ──
  const [patientsList, setPatientsList] = useState([])
  const [isLoading, setIsLoading]       = useState(false)

  useEffect(() => {
    if (!nurse) return
    setIsLoading(true)
    api.getPatients()
      .then((data) => {
        setPatientsList(data)
        if (data.length > 0 && !activePatientId) setActivePatientId(data[0].id)
      })
      .catch((err) => console.error('Failed to load patients:', err))
      .finally(() => setIsLoading(false))
  }, [nurse])

  // ── Auth Handlers ──
  function handleLogin(nurseData) {
    setNurse(nurseData)
  }

  function handleLogout() {
    setNurse(null)
    setAuthScreen('login')
    setActivePage('dashboard')
    setPatientsList([])
  }

  // ── Auth Gate ──
  if (!nurse) {
    if (authScreen === 'signup') {
      return <SignupPage onSignup={handleLogin} onGoToLogin={() => setAuthScreen('login')} />
    }
    return <LoginPage onLogin={handleLogin} onGoToSignup={() => setAuthScreen('signup')} />
  }

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-canvas)' }}>
        <h2 style={{ color: 'var(--text-muted)' }}>Loading Provider Portal...</h2>
      </div>
    )
  }

  // ── Main App ──
  const PAGES = {
    dashboard:  <DashboardPage activePatientId={activePatientId} allPatients={patientsList} onSelectPatient={setActivePatientId} />,
    statistics: <StatisticsPage activePatientId={activePatientId} />,
    patients:   <PatientListPage patientsList={patientsList} onViewPatient={(id) => { setActivePatientId(id); setActivePage('statistics') }} />,
    messages:   <MessagesPage />,
    account:    <AccountSettingsPage onLogout={handleLogout} nurse={nurse} />,
  }

  return (
    <div className="app-shell">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        activePatientId={activePatientId}
        patientsList={patientsList}
        onSelectPatient={setActivePatientId}
        onOpenNotifs={() => setNotifOpen(true)}
        nurse={nurse}
      />

      <main className="main-content">
        <Header title={activePage} onBellClick={() => setNotifOpen(true)} />
        <div className="page-wrapper">
          {PAGES[activePage]}
        </div>
      </main>

      <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}