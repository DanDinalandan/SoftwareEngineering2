import { nurseProfile, patients, patientStats, messages } from '../data/mockData.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ── Internal builder: dashboard subset ───────────────────────
function buildDashboardData(patientId) {
  const patientInfo = patients.find(p => p.id === patientId)
  const stats       = patientStats[patientId]
  const isAlert     = patientInfo.status === 'alert'

  return {
    info: patientInfo,

    todaysLog: isAlert ? null : {
      mood:       patientInfo.todaysMood,
      triggers:   [patientInfo.topTrigger],
      vapedToday: patientInfo.streak === 0 ? 'Yes' : 'No',
    },

    insights: {
      riskScore:    patientInfo.riskScore,
      riskLevel:    patientInfo.riskScore >= 70 ? 'High Risk'
                  : patientInfo.riskScore >= 40 ? 'Moderate'
                  : 'Low-Moderate',
      cravingLevel: stats.cravingLevel,
      correlation:  stats.correlation,
      streaks:      stats.streaks,
    },
  }
}

// ── Internal builder: statistics/profile subset ──────────────
function buildProfileData(patientId) {
  const patientInfo = patients.find(p => p.id === patientId)
  const stats       = patientStats[patientId]

  return {
    info: patientInfo,

    insights: {
      riskScore:       patientInfo.riskScore,
      riskLevel:       patientInfo.riskScore >= 70 ? 'High Risk'
                     : patientInfo.riskScore >= 40 ? 'Moderate'
                     : 'Low-Moderate',
      streakDays:      patientInfo.streak,
      avgMood:         patientInfo.status === 'alert'   ? 1.8
                     : patientInfo.status === 'monitor' ? 2.9 : 3.4,
      adherence:       patientInfo.status === 'alert'   ? '60%'
                     : patientInfo.status === 'monitor' ? '85%' : '100%',
      cravingLevel:    stats.cravingLevel,
      correlation:     stats.correlation,
      streaks:         stats.streaks,
      moodWeek:        stats.moodWeek,
      sparkline:       stats.sparkline,
      milestones:      stats.milestones,
      bestMoodDay:     stats.bestMoodDay,
      worstCravingDay: stats.worstCravingDay,
      highestRiskDay:  stats.highestRiskDay,
      lastRelapse:     stats.lastRelapse,
    },
  }
}

export const api = {
  // 1. Nurse/user profile — used by LoginPage, Sidebar, AccountSettingsPage
  getNurseProfile: async () => {
    await delay(300)
    return nurseProfile
  },

  // 2. Patient roster — used by App (loads once on login), PatientListPage, Sidebar
  getPatients: async () => {
    await delay(600)
    return patients
  },

  // 3. Dashboard data for a single patient — used by DashboardPage
  getPatientDashboard: async (patientId) => {
    await delay(800)
    return buildDashboardData(patientId)
  },

  // 4. Full statistics/profile for a single patient — used by StatisticsPage
  getPatientProfile: async (patientId) => {
    await delay(800)
    return buildProfileData(patientId)
  },

  // 5. All messages for the nurse's inbox — used by MessagesPage
  getMessages: async () => {
    await delay(500)
    return messages
  },
}