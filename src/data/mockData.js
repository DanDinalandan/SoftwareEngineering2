export const patients = [
  {
    id: 1,
    name: 'Louise Reyes',
    email: 'louise@email.com',
    emoji: '👦🏻',
    age: 22, sex: 'F',
    day: 14, streak: 14, streakLabel: '14 days',
    lastMood: '😐 Okay',
    topTrigger: 'Stress', triggerLevel: 'normal',
    riskScore: 28, riskColor: 'var(--green)',
    status: 'stable',
  },
  {
    id: 2,
    name: 'Marco Kalaw',
    email: 'marco@email.com',
    emoji: '👨🏻',
    age: 19, sex: 'M',
    day: 3, streak: 0, streakLabel: '0 days',
    lastMood: '😫 Awful',
    topTrigger: 'Stress', triggerLevel: 'high',
    riskScore: 78, riskColor: 'var(--red)',
    status: 'alert',
  },
  {
    id: 3,
    name: 'Ana Navarro',
    email: 'ana@email.com',
    emoji: '👩🏻',
    age: 28, sex: 'F',
    day: 30, streak: 30, streakLabel: '30 days',
    lastMood: '🙂 Good',
    topTrigger: 'Social', triggerLevel: 'normal',
    riskScore: 14, riskColor: 'var(--green)',
    status: 'stable',
  },
  {
    id: 4,
    name: 'Ben Panganiban',
    email: 'ben@email.com',
    emoji: '👨🏽',
    age: 25, sex: 'M',
    day: 7, streak: 7, streakLabel: '7 days',
    lastMood: '😐 Okay',
    topTrigger: 'Boredom', triggerLevel: 'normal',
    riskScore: 51, riskColor: 'var(--amber)',
    status: 'monitor',
  },
  {
    id: 5,
    name: 'Carlo Mendoza',
    email: 'carlo@email.com',
    emoji: '👩🏻',
    age: 21, sex: 'M',
    day: 5, streak: 0, streakLabel: 'Relapsed',
    lastMood: '😫 Awful',
    topTrigger: 'Sadness', triggerLevel: 'high',
    riskScore: 83, riskColor: 'var(--red)',
    status: 'alert',
  },
  {
    id: 6,
    name: 'Jamie Lim',
    email: 'jamie@email.com',
    emoji: '👩🏽',
    age: 23, sex: 'F',
    day: 1, streak: 0, streakLabel: 'New',
    lastMood: '😐 Okay',
    topTrigger: 'After meals', triggerLevel: 'normal',
    riskScore: 42, riskColor: 'var(--amber)',
    status: 'monitor',
  },
  {
    id: 7,
    name: 'Ramon Torres',
    email: 'ramon@email.com',
    emoji: '👴🏻',
    age: 45, sex: 'M',
    day: 60, streak: 60, streakLabel: '60 days',
    lastMood: '😁 Great',
    topTrigger: 'Pressure', triggerLevel: 'normal',
    riskScore: 9, riskColor: 'var(--green)',
    status: 'stable',
  },
  {
    id: 8,
    name: 'Diana Cruz',
    email: 'diana@email.com',
    emoji: '👩🏼',
    age: 31, sex: 'F',
    day: 21, streak: 5, streakLabel: '5 days',
    lastMood: '🙁 Bad',
    topTrigger: 'Social', triggerLevel: 'normal',
    riskScore: 47, riskColor: 'var(--amber)',
    status: 'monitor',
  },
]

export const notifications = [
  { id: 1,  type: 'alert',   icon: '🚨', title: 'High relapse risk — Marco K.',   desc: 'Craving intensity spiked to 8.5/10. Recommend immediate check-in.',                   time: 'Today · 10:42 AM',   unread: true  },
  { id: 2,  type: 'alert',   icon: '⚠️', title: 'Missed log — Marco K.',           desc: 'Patient has not submitted a daily log for 2 consecutive days.',                        time: 'Today · 09:00 AM',   unread: true  },
  { id: 3,  type: 'warning', icon: '📊', title: 'Risk score increase — Ben P.',    desc: 'Relapse risk score increased from 32 to 51 over the past 3 days.',                    time: 'Today · 08:15 AM',   unread: true  },
  { id: 4,  type: 'info',    icon: '📋', title: 'Mood log submitted — Louise R.',  desc: "Patient completed today's mood and craving log. Mood: Okay.",                         time: 'Today · 08:14 AM',   unread: false },
  { id: 5,  type: 'success', icon: '🏆', title: '30-day milestone — Ana N.',       desc: 'Patient reached 30 days smoke-free. Consider a follow-up to reinforce progress.',     time: 'Yesterday · 6:30 PM', unread: false },
  { id: 6,  type: 'info',    icon: '💬', title: 'Message — Louise R.',             desc: "\"Hi nurse, I had a tough time at dinner but I didn't vape. Just wanted to share.\"", time: 'Yesterday · 9:20 PM', unread: false },
  { id: 7,  type: 'success', icon: '📈', title: '7-day streak — Ben P.',           desc: 'Patient completed 7 consecutive vape-free days. Risk score is stabilizing.',          time: 'May 21 · 12:00 PM',  unread: false },
  { id: 8,  type: 'warning', icon: '😞', title: 'Low mood — Carlo M.',             desc: 'Patient rated mood as "Awful" — third consecutive day of low mood scores.',           time: 'May 21 · 7:45 PM',   unread: false },
  { id: 9,  type: 'alert',   icon: '🔁', title: 'Relapse reported — Carlo M.',     desc: 'Patient self-reported vaping today. Streak reset. Clinical review recommended.',      time: 'May 20 · 11:00 PM',  unread: false },
  { id: 10, type: 'info',    icon: '🆕', title: 'New patient enrolled — Jamie L.', desc: 'A new patient has been added to your monitoring list. Day 1 begins today.',           time: 'May 20 · 9:00 AM',   unread: false },
]

export const correlationData = [
  { trigger: 'Stress',      width: 80, level: 'high', freq: '7×/wk' },
  { trigger: 'Sadness',     width: 70, level: 'high', freq: '6×/wk' },
  { trigger: 'Social',      width: 60, level: 'mid',  freq: '5×/wk' },
  { trigger: 'Boredom',     width: 50, level: 'mid',  freq: '4×/wk' },
  { trigger: 'Pressure',    width: 30, level: 'low',  freq: '2×/wk' },
  { trigger: 'After meals', width: 10, level: 'low',  freq: '1×/wk' },
]

export const streakBars = [
  { label: 'M',  height: 24, level: 'low'  },
  { label: 'T',  height: 32, level: 'low'  },
  { label: 'W',  height: 48, level: 'mid'  },
  { label: 'TH', height: 56, level: 'mid'  },
  { label: 'F',  height: 64, level: 'high' },
  { label: 'S',  height: 80, level: 'high' },
  { label: 'SU', height: 56, level: 'mid'  },
  { label: 'M',  height: 24, level: 'low'  },
  { label: 'T',  height: 32, level: 'low'  },
  { label: 'W',  height: 48, level: 'mid'  },
  { label: 'TH', height: 56, level: 'mid'  },
  { label: 'F',  height: 72, level: 'high' },
  { label: 'S',  height: 80, level: 'high' },
  { label: 'SU', height: 64, level: 'mid'  },
]

export const moodWeek = [
  { emoji: '😐', label: 'MON' },
  { emoji: '🙁', label: 'TUE' },
  { emoji: '😐', label: 'WED' },
  { emoji: '😐', label: 'THU' },
  { emoji: '🙂', label: 'FRI' },
  { emoji: '🙂', label: 'SAT' },
  { emoji: '😐', label: 'SUN' },
]

export const sparklineData = [
  { height: 18, level: 'low'  },
  { height: 26, level: 'mid'  },
  { height: 30, level: 'mid'  },
  { height: 38, level: 'high' },
  { height: 35, level: 'high' },
  { height: 24, level: 'mid'  },
  { height: 16, level: 'low'  },
]

export const milestones = [
  { label: '7 days',  sub: 'Achieved',     done: true  },
  { label: '14 days', sub: 'Today',        done: true  },
  { label: '30 days', sub: '16 days left', done: false },
  { label: '60 days', sub: '46 days left', done: false },
  { label: '90 days', sub: '76 days left', done: false },
]

export const activityLog = [
  { icon: '📋', text: "Viewed Louise Reyes' dashboard",       time: 'Today · 10:05 AM'    },
  { icon: '🔔', text: 'Dismissed alert for Marco Kalaw',      time: 'Today · 09:48 AM'    },
  { icon: '✏️', text: 'Updated notification preferences',     time: 'Yesterday · 3:12 PM' },
  { icon: '💬', text: 'Replied to patient message — Louise R.', time: 'May 21 · 9:30 PM'  },
  { icon: '🔐', text: 'Password changed successfully',         time: 'May 18 · 11:00 AM'  },
]

export const prefToggles = [
  { label: 'High relapse risk alerts',  sub: 'Triggered when any patient score exceeds 70',  defaultOn: true  },
  { label: 'Missed daily logs',          sub: 'Alert after 1 missed log',                    defaultOn: true  },
  { label: 'Milestone achievements',     sub: 'At 7, 14, 30, 60, 90-day goals',              defaultOn: true  },
  { label: 'Mood decline alerts',        sub: '3 consecutive days of low mood',              defaultOn: false },
  { label: 'Patient messages',           sub: 'In-app messages from your patients',          defaultOn: true  },
  { label: 'Email digest',              sub: 'Daily summary of all patient activity',        defaultOn: false },
  { label: 'New patient enrollment',     sub: 'When a patient is assigned to you',           defaultOn: true  },
  { label: 'Relapse self-report',        sub: 'Immediate alert when patient reports vaping', defaultOn: true  },
]

export const moodOptions = [
  { emoji: "😫", label: "Awful" },
  { emoji: "🙁", label: "Bad" },
  { emoji: "😐", label: "Okay", isSelected: true },
  { emoji: "🙂", label: "Good" },
  { emoji: "😁", label: "Great" }
];

export const triggerTags = ["Stress", "Sadness", "Social", "Boredom", "After meals"];

export const currentPatient = {
  name:      'Patient Name',
  email:     'Patient@email.com',
  emoji:     '👦🏻',
  sex:       'M',
  age:       23,
  condition: 'Nicotine Addiction',
}

// ── messages mock data ────────────────────────────────────────
export const messages = [
  {
    id: 1,
    patientName: 'Analyn Reyes',
    patientEmoji: '👦🏻',
    subject: 'Check-in after dinner trigger',
    preview: "Hi nurse, I had a tough time at dinner but I didn't vape.",
    body: "Hi nurse,\n\nI had a tough time at dinner tonight — my friends were smoking outside and it was really hard. But I managed to not vape. I just wanted to share that.\n\nThanks for your support.\n\n— Louise",
    time: 'Today · 9:20 PM',
    unread: true,
  },
  {
    id: 2,
    patientName: 'Marco Kalaw',
    patientEmoji: '👨🏻',
    subject: 'I missed my log, sorry',
    preview: "I forgot to log the past two days. I've been really stressed.",
    body: "Hi,\n\nI'm sorry I missed logging the past two days. Things have been really stressful at school and I kept forgetting. I didn't relapse though.\n\nI'll try to be more consistent.\n\n— Marco",
    time: 'Yesterday · 11:05 AM',
    unread: true,
  },
  {
    id: 3,
    patientName: 'Ana Navarro',
    patientEmoji: '👩🏻',
    subject: '30 days! Thank you!',
    preview: "I can't believe I made it to 30 days. Thank you so much!",
    body: "Dear Nurse,\n\nI just wanted to say thank you. I hit 30 days today and I honestly couldn't have done it without the check-ins. It means a lot.\n\nI'll keep going!\n\n— Ana",
    time: 'May 21 · 6:45 PM',
    unread: false,
  },
  {
    id: 4,
    patientName: 'Ben Panganiban',
    patientEmoji: '👨🏽',
    subject: 'Question about coping strategies',
    preview: 'When boredom hits at night, what should I do instead of vaping?',
    body: "Hi Nurse,\n\nI have a question. Boredom at night is my biggest trigger. What are some things I can do to keep my hands and mind busy when the urge hits?\n\nThank you!\n\n— Ben",
    time: 'May 20 · 8:30 PM',
    unread: false,
  },
  {
    id: 5,
    patientName: 'Diana Cruz',
    patientEmoji: '👩🏼',
    subject: 'Feeling discouraged this week',
    preview: "It's been a rough week. I had two near-relapses.",
    body: "Hi,\n\nThis week has been really hard. I had two situations where I almost gave in. I didn't, but I feel like I'm hanging by a thread.\n\nCan we schedule a call?\n\n— Diana",
    time: 'May 19 · 3:10 PM',
    unread: false,
  },
]