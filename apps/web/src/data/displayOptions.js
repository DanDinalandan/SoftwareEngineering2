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

export const TIME_SLOTS = [
  { id: 'early_morning', label: 'Early Morning', sub: '12am – 6am', hour: 3 },
  { id: 'morning', label: 'Morning', sub: '6am – 10am', hour: 8 },
  { id: 'midday', label: 'Midday', sub: '10am – 1pm', hour: 11 },
  { id: 'afternoon', label: 'Afternoon', sub: '1pm – 5pm', hour: 14 },
  { id: 'evening', label: 'Evening', sub: '5pm – 9pm', hour: 18 },
  { id: 'night', label: 'Night', sub: '9pm – 12am', hour: 22 },
];

export const DURATIONS = [
  { id: 'under_5', label: 'under 5 min', minutes: 4 },
  { id: 'under_15', label: '5–15 min', minutes: 10 },
  { id: 'under_30', label: '15–30 min', minutes: 22 },
  { id: 'under_60', label: '30–60 min', minutes: 45 },
  { id: 'over_60', label: 'over an hour', minutes: 90 },
];

export const VAPE_DEVICES = [
  { id: 'pod', label: 'Pod System' },
  { id: 'disposable', label: 'Disposable' },
  { id: 'mod', label: 'Box Mod' },
  { id: 'pen', label: 'Vape Pen' },
  { id: 'other', label: 'Other' },
];