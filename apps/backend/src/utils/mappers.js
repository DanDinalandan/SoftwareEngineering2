export function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    role: row.role,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    middleName: row.middle_name || '',
    suffix: row.suffix || '',
    birthday: row.birthday || '',
    age: row.age ?? '',
    gender: row.gender || '',
    phone: row.phone || '',
    timezone: row.timezone || 'UTC',
    streak: row.streak || 0,
    daysLogged: row.days_logged || 0,
    totalPoints: row.total_points || 0,
    lastRelapseRisk: row.last_relapse_risk || 0,
    profileComplete: row.profile_complete || false,
    connectedPeerUserId: row.connected_peer_user_id,
    connectedVapeUserId: row.connected_vape_user_id,
    connectedProviderId: row.connected_provider_id,
    connectedPeerUsername: row.connected_peer_username,
    connectedVapeUserUsername: row.connected_vape_user_username,
    connectedProviderName: row.connected_provider_name,
    peerRelationship: row.peer_relationship,
    progressSharedWithPeer: row.progress_shared_with_peer || false,
    vapeUserRelationshipLabel: row.vape_user_relationship_label,
    vapeTypes: row.vape_types || [],
    goal: row.goal,
    twoFAEnabled: row.two_fa_enabled || false,
    unlockedRewards: row.unlocked_rewards || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toProvider(row) {
  if (!row) return null;
  const name = `${row.first_name || ''} ${row.last_name || ''}`.trim();
  return {
    id: row.id,
    name,
    email: row.email,
    license: row.license,
    department: row.department || '',
    phone: row.phone || '',
    notificationPreferences: row.notification_preferences || {},
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    middleName: row.middle_name || '',
    suffix: row.suffix || '',
    gender: row.gender || '',
    dob: row.dob,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toMoodLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.log_date,
    mood: row.mood,
    triggers: row.triggers || [],
    craving: row.craving,
    cravingLevel: (row.craving || 0) * 10,
    vaped: row.vaped,
    vapedToday: row.vaped ? 'Yes' : 'No',
    puffsToday: row.puffs_today || 0,
    vapeMinutes: row.vape_minutes || 0,
    vapedSessions: row.vaped_sessions || [],
    vapedHour: row.vaped_hour,
    comment: row.comment || '',
    notes: row.comment || '',
    relapseRisk: row.relapse_risk,
    points: row.points,
    timestamp: row.display_timestamp,
    deviceTimezone: row.device_timezone || 'UTC',
    localLoggedAt: row.local_logged_at || '',
    createdAt: row.created_at,
  };
}

