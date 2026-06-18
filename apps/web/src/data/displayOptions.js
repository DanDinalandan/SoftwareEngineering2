export const moodLogOptions = [
  { emoji: '😫', label: 'Awful' },
  { emoji: '🙁', label: 'Bad' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😄', label: 'Great' },
];

export const triggerTagList = ['Stress', 'Sadness', 'Social', 'Boredom', 'After meals', '+ Other'];

export const cravingThresholds = [
  { max: 30, label: 'Mild' },
  { max: 60, label: 'Mild-Moderate' },
  { max: 80, label: 'Moderate' },
  { max: 100, label: 'Intense' },
];

export const notificationFilters = [
  { label: 'All', fn: () => true },
  { label: 'Alerts', fn: (n) => n.type === 'alert' || n.type === 'high_risk' || n.type === 'vaped' },
  { label: 'Updates', fn: (n) => n.type === 'info' || n.type === 'warning' || n.type === 'connection_request' },
  { label: 'Milestones', fn: (n) => n.type === 'success' || n.type === 'milestone' },
];

export const prefToggles = [
  { label: 'High relapse risk alerts', sub: 'Triggered when any patient score exceeds 70', defaultOn: true },
  { label: 'Missed daily logs', sub: 'Alert after 1 missed log', defaultOn: true },
  { label: 'Patient messages', sub: 'In-app messages from your patients', defaultOn: true },
  { label: 'Email digest', sub: 'Daily summary of all patient activity', defaultOn: false },
  { label: 'Relapse self-report', sub: 'Immediate alert when patient reports vaping', defaultOn: true },

  // hidden
  // { label: 'Milestone achievements', sub: 'At 7, 14, 30, 60, 90-day goals', defaultOn: true },
  // { label: 'Mood decline alerts', sub: '3 consecutive days of low mood', defaultOn: false },
  // { label: 'New patient enrollment', sub: 'When a patient is assigned to you', defaultOn: true },
];

