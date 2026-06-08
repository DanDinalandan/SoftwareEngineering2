import { nurseProfile, patients, patientStats, messages, notifications, patientLogHistory } from '../data/mockData.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// ── dashboard subset ───────────────────────
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

// ── statistics/profile subset ──────────────
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
  // Nurse/user profile used by LoginPage, Sidebar, AccountSettingsPage
  getNurseProfile: async () => {
    await delay(300)
    return nurseProfile
  },

  // Patient roster used by App (loads once on login), PatientListPage, Sidebar
  getPatients: async () => {
    await delay(600)
    return patients
  },

  // Dashboard data for a single patient  used by DashboardPage
  getPatientDashboard: async (patientId) => {
    await delay(800)
    return buildDashboardData(patientId)
  },

  // Statistics for a single patient  used by StatisticsPage
  getPatientProfile: async (patientId) => {
    await delay(800)
    return buildProfileData(patientId)
  },

  // Messages  used by MessagesPage
  getMessages: async () => {
    await delay(500)
    return messages
  },

  // Notifications used by NotificationsPanel
  getNotifications: async () => {
    await delay(400)
    return notifications
  },

  // Mark a single notification as read
  markNotificationRead: async (notificationId) => {
    await delay(150)
    return { success: true, id: notificationId }
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    await delay(200)
    return { success: true }
  },

  // Daily log history for a single patient  used by HistoryPage
  getPatientLogHistory: async (patientId) => {
    await delay(600)
    return patientLogHistory[patientId] ?? []
  },

  // Mark a single message as read used by MessagesPage on item click
  markMessageRead: async (messageId) => {
    await delay(150)
    return { success: true, id: messageId }
  },
}