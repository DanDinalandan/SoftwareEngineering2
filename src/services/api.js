import { patients, patientStats } from '../data/mockData.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function buildPatientData(patientId) {
  const patientInfo = patients.find(p => p.id === patientId)
  const stats       = patientStats[patientId]
  const isAlert     = patientInfo.status === 'alert'

  return {
    info: patientInfo,

    todaysLog: isAlert ? null : {
      mood:       patientInfo.lastMood.split(' ')[1], // e.g. "Okay" from "😐 Okay"
      triggers:   [patientInfo.topTrigger],
      vapedToday: patientInfo.streak === 0 ? 'Yes' : 'No',
    },

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
  getPatients: async () => {
    await delay(600)
    return patients
  },

  // dashboard page
  getPatientDashboard: async (patientId) => {
    await delay(800)
    return buildPatientData(patientId)
  },

  // statistics page 
  getPatientProfile: async (patientId) => {
    await delay(800)
    return buildPatientData(patientId)
  },
}