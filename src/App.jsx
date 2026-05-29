import { useState } from 'react'
import Sidebar            from './components/Sidebar.jsx'
import FloatingBell       from './components/FloatingBell.jsx'
import Header             from './components/Header.jsx';
import NotificationsPanel from './components/NotificationsPanel.jsx'
import DashboardPage       from './pages/DashboardPage.jsx'
import StatisticsPage      from './pages/StatisticsPage.jsx'
import PatientListPage     from './pages/PatientListPage.jsx'
import AccountSettingsPage from './pages/AccountSettingsPage.jsx'
import MessagesPage        from './pages/MessagesPage.jsx'
import { patients }        from './data/mockData.js'

export default function App() {
  const [activePage,     setActivePage    ] = useState('dashboard')
  const [notifOpen,      setNotifOpen     ] = useState(false)
  const [activePatientId, setActivePatientId] = useState(1)
  const activePatient = patients.find(p => p.id === activePatientId) ?? patients[0]

  const PAGES = {
      dashboard:  <DashboardPage
                    activePatient={activePatient}
                    activePatientId={activePatientId}
                    onSelectPatient={setActivePatientId}
                    allPatients={patients}
                  />,
      statistics: <StatisticsPage activePatient={activePatient} />,
      patients:   <PatientListPage
                    activePatientId={activePatientId}
                    onSelectPatient={(id) => { setActivePatientId(id); setActivePage('dashboard') }}
                  />,
      messages:   <MessagesPage />,
      account:    <AccountSettingsPage />,
    }

  return (
    <div className="app-shell">

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        activePatientId={activePatientId}
        onSelectPatient={(id) => { setActivePatientId(id); setActivePage('dashboard') }}
      />

      <main className="main-content">
        <Header 
           title={activePage} 
           onBellClick={() => setNotifOpen(true)} 
        />

        <div className="page-wrapper">
          {PAGES[activePage] ?? <DashboardPage activePatient={activePatient} />}
        </div>
      </main>

      <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}