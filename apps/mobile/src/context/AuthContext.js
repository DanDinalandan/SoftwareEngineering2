import React, { createContext, useContext, useState } from 'react';
import { apiRequest, clearAuthToken, setAuthToken } from '../services/api';

/**
 * In-memory store — replace each function body with real API calls.
 * See BACKEND_README.md for full API spec.
 */
const registeredUsers = [];
const connectionRequests = [];
const messages = [];
const notifications = [];

let _nextId = 1;
const uid = () => String(_nextId++);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifTick, setNotifTick] = useState(0);

  const refresh = (user) => {
    setCurrentUser({ ...user });
    setNotifTick((n) => n + 1);
  };

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const register = async ({ email, username, password, phone = '' }) => {
    try {
      const { token, user } = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password, phone }),
      });
      const hydratedUser = { ...user, moodLogs: [] };
      setAuthToken(token);
      setCurrentUser(hydratedUser);
      return { success: true, user: hydratedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  // FIX: Login goes straight to Dashboard if profileComplete — no re-asking for details
  const login = async ({ identifier, password, role }) => {
    try {
      const { token, user } = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, role }),
      });
      setAuthToken(token);
      const moodData = await apiRequest('/mood').catch(() => ({ moodLogs: [] }));
      const hydratedUser = { ...user, moodLogs: moodData.moodLogs || [] };
      setCurrentUser(hydratedUser);
      return { success: true, user: hydratedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const setRole = async (role) => {
    if (!currentUser) return;
    const { user } = await apiRequest('/user/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
    refresh({ ...currentUser, ...user });
  };

  const saveDetails = async ({ firstName, lastName, middleName, suffix, birthday, age, gender, vapeTypes = [] }) => {
    if (!currentUser) return;
    const { user } = await apiRequest('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName, lastName, middleName, suffix, birthday, age, gender, vapeTypes }),
    });
    refresh({ ...currentUser, ...user, moodLogs: currentUser.moodLogs || [] });
  };

  // ── LOG MOOD ENTRY ────────────────────────────────────────────────────────
  const logMoodEntry = async ({ mood, triggers, craving, vaped, puffsToday = 0, vapedHour = null, comment = '' }) => {
    if (!currentUser) return { error: 'Not logged in' };
    try {
      const result = await apiRequest('/mood', {
        method: 'POST',
        body: JSON.stringify({ mood, triggers, craving, vaped, puffsToday, vapedHour, comment }),
      });
      const updatedUser = {
        ...currentUser,
        moodLogs: [result.entry, ...(currentUser.moodLogs || [])],
        streak: result.newStreak,
        totalPoints: currentUser.totalPoints + result.pointsEarned,
        lastRelapseRisk: result.relapseRisk,
      };
      const newlyUnlocked = _checkAndUnlockRewards(updatedUser);
      refresh(updatedUser);
      return { success: true, ...result, entryId: result.entry.id, newlyUnlocked };
    } catch (error) {
      if (error.message.toLowerCase().includes('already logged')) return { alreadyLogged: true };
      return { success: false, error: error.message };
    }
    const today = new Date().toISOString().split('T')[0];
    if (currentUser.moodLogs.find((l) => l.date === today)) return { alreadyLogged: true };

    const moodRisk = { Great: 0, Good: 10, Okay: 30, Bad: 60, Awful: 80 }[mood] ?? 30;
    const relapseRisk = Math.min(100, Math.round(
      (craving / 10) * 100 * 0.5 + moodRisk * 0.3 + Math.min(triggers.length * 15, 60) * 0.2
    ));
    const pointsEarned = 10 + (!vaped ? 15 : 0);
    const newStreak = !vaped ? currentUser.streak + 1 : 0;

    const entry = {
      id: uid(), date: today, mood, triggers, craving, vaped,
      puffsToday: vaped ? puffsToday : 0,
      vapedHour:  vaped ? vapedHour  : null,
      comment,
      relapseRisk, points: pointsEarned,
      timestamp: new Date().toLocaleString(),
    };
    currentUser.moodLogs.push(entry);
    currentUser.streak = newStreak;
    currentUser.totalPoints += pointsEarned;
    currentUser.lastRelapseRisk = relapseRisk;

    // Notify connected peer (only if vape user opted to share progress)
    const peerUsername = currentUser.connectedPeerUsername;
    if (peerUsername && currentUser.progressSharedWithPeer) {
      const displayName = currentUser.firstName || currentUser.username;
      if (relapseRisk > 60 || mood === 'Awful' || mood === 'Bad') {
        _pushNotification({
          toUsername: peerUsername, type: 'high_risk',
          message: `⚠️ ${displayName} logged ${mood.toLowerCase()} mood with ${relapseRisk}% relapse risk. They may need support.`,
        });
      }
      if (vaped) {
        _pushNotification({
          toUsername: peerUsername, type: 'vaped',
          message: `💔 ${displayName} reported vaping today. Consider reaching out.`,
        });
      }
    }

    const newlyUnlocked = _checkAndUnlockRewards(currentUser);
    refresh(currentUser);
    return { success: true, pointsEarned, newStreak, relapseRisk, entryId: entry.id, newlyUnlocked };
  };

  // ── DELETE LOG ENTRY ──────────────────────────────────────────────────────
  const deleteLogEntry = (entryId) => {
    if (!currentUser) return;
    const idx = currentUser.moodLogs.findIndex((l) => l.id === entryId);
    if (idx === -1) return;
    const entry = currentUser.moodLogs[idx];
    currentUser.moodLogs.splice(idx, 1);
    currentUser.totalPoints = Math.max(0, currentUser.totalPoints - entry.points);
    if (!entry.vaped && currentUser.streak > 0) currentUser.streak = Math.max(0, currentUser.streak - 1);
    refresh(currentUser);
  };

  // ── REWARD SYSTEM ─────────────────────────────────────────────────────────
  // Each reward has an id, condition function, and metadata.
  // Conditions receive the currentUser object after the log is saved.
  const REWARD_DEFS = [
    { id: 'first_log',      icon: '🌿', name: 'First Step',       pts: 10,   desc: 'Logged your first mood entry',       condition: (u) => u.moodLogs.length >= 1 },
    { id: 'streak_3',       icon: '🌙', name: '3-Day Streak',      pts: 50,   desc: 'Stayed vape-free for 3 days',        condition: (u) => u.streak >= 3 },
    { id: 'streak_7',       icon: '⭐', name: 'One Week Clean',    pts: 100,  desc: '7 days smoke-free — incredible!',    condition: (u) => u.streak >= 7 },
    { id: 'streak_14',      icon: '🔥', name: 'Two Weeks Strong',  pts: 200,  desc: '14 days and still going!',           condition: (u) => u.streak >= 14 },
    { id: 'streak_30',      icon: '💎', name: 'One Month Free',    pts: 500,  desc: '30 days — you are a champion',       condition: (u) => u.streak >= 30 },
    { id: 'streak_100',     icon: '🏆', name: '100 Days',          pts: 2000, desc: 'A legendary milestone',              condition: (u) => u.streak >= 100 },
    { id: 'logs_7',         icon: '📓', name: 'Consistent Logger', pts: 80,   desc: 'Logged 7 days in a row',             condition: (u) => u.moodLogs.length >= 7 },
    { id: 'logs_30',        icon: '📊', name: 'Data Driven',       pts: 300,  desc: 'Logged 30 total entries',            condition: (u) => u.moodLogs.length >= 30 },
    { id: 'zero_puffs_3',  icon: '🚭', name: 'Puff-Free Trio',    pts: 75,   desc: '3 consecutive days with 0 puffs',    condition: (u) => {
        const sorted = [...u.moodLogs].sort((a,b)=>a.date.localeCompare(b.date));
        let streak = 0, best = 0;
        sorted.forEach(l => { if(!l.vaped){ streak++; best=Math.max(best,streak); } else { streak=0; } });
        return best >= 3;
    }},
    { id: 'goal_set',       icon: '🎯', name: 'Goal Setter',       pts: 30,   desc: 'Set your first quit goal',           condition: (u) => !!u.goal },
    { id: 'peer_connected', icon: '🤝', name: 'Not Alone',         pts: 50,   desc: 'Connected with a peer supporter',    condition: (u) => !!u.connectedPeerUsername },
  ];

  // Check all reward conditions and unlock newly earned ones
  function _checkAndUnlockRewards(user) {
    if (!user.unlockedRewards) user.unlockedRewards = [];
    const newlyUnlocked = [];
    REWARD_DEFS.forEach((r) => {
      if (!user.unlockedRewards.includes(r.id) && r.condition(user)) {
        user.unlockedRewards.push(r.id);
        user.totalPoints += r.pts; // bonus points for earning badge
        newlyUnlocked.push(r);
      }
    });
    return newlyUnlocked;
  }

  // Expose reward defs and unlocked list for RewardsScreen
  const getRewardDefs   = () => REWARD_DEFS;
  const getUnlockedIds  = () => currentUser?.unlockedRewards || [];

  // ── PEER CONNECTION ───────────────────────────────────────────────────────
  // Peer sends request TO a Vape User (by username)
  const sendConnectionRequest = (toUsername) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    const target = registeredUsers.find((u) => u.username === toUsername.toLowerCase().trim());
    if (!target) return { success: false, error: 'User not found.' };

    // Role validation: Peer can only connect to Vape User
    if (currentUser.role === 'Peer' && target.role !== 'Vape User')
      return { success: false, error: 'You can only connect to Vape Users.' };
    if (currentUser.role === 'Vape User' && target.role !== 'Peer')
      return { success: false, error: 'You can only connect to Peer Supporters.' };

    if (target.connectedPeerUsername || target.connectedVapeUserUsername)
      return { success: false, error: 'That user is already connected to someone.' };
    if (currentUser.connectedPeerUsername || currentUser.connectedVapeUserUsername)
      return { success: false, error: 'You are already connected to someone.' };

    const existing = connectionRequests.find(
      (r) => r.fromUsername === currentUser.username && r.toUsername === target.username && r.status === 'pending'
    );
    if (existing) return { success: false, error: 'Request already sent.' };

    const reqId = uid();
    connectionRequests.push({
      id: reqId,
      fromUsername: currentUser.username,
      fromRole: currentUser.role,
      fromDisplayName: currentUser.firstName || currentUser.username,
      toUsername: target.username,
      status: 'pending',
    });

    // FIX: notification goes to VAPE USER (the recipient), not the peer
    // Peer always sends to Vape User → Vape User receives invitation
    const recipientUsername = target.username;
    const senderName = currentUser.firstName
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : currentUser.username;

    _pushNotification({
      toUsername: recipientUsername,
      type: 'connection_request',
      message: `${senderName} wants to be your peer supporter. Accept to let them see your progress.`,
      requestId: reqId,
      fromUsername: currentUser.username,
      fromDisplayName: senderName,
    });

    return { success: true };
  };

  // Vape User responds to peer's request — if accepting, must also set relationship + confirm sharing
  // relationship: 'Friend' | 'Family' | 'Partner' | 'Colleague' | 'Other'
  const respondToRequest = (requestId, accept, relationship = null) => {
    const req = connectionRequests.find((r) => r.id === requestId);
    if (!req) return;
    req.status = accept ? 'accepted' : 'rejected';

    if (accept) {
      const from = registeredUsers.find((u) => u.username === req.fromUsername); // the Peer
      const to = registeredUsers.find((u) => u.username === req.toUsername);     // the Vape User

      if (from && to) {
        // Link them
        from.connectedVapeUserUsername = to.username;
        to.connectedPeerUsername = from.username;
        to.peerRelationship = relationship;
        to.progressSharedWithPeer = true; // they said yes to sharing

        // Store relationship on peer side too
        from.vapeUserRelationshipLabel = relationship;

        // Notify the Peer that their request was accepted
        _pushNotification({
          toUsername: from.username,
          type: 'connection_accepted',
          message: `✅ ${to.firstName || to.username} accepted your connection request! You are now their peer supporter.`,
        });
      }
    } else {
      // Notify peer of rejection
      const from = registeredUsers.find((u) => u.username === req.fromUsername);
      const to = registeredUsers.find((u) => u.username === req.toUsername);
      if (from && to) {
        _pushNotification({
          toUsername: from.username,
          type: 'connection_rejected',
          message: `${to.firstName || to.username} declined your connection request.`,
        });
      }
    }
    refresh(currentUser);
  };

  // ── GOAL ────────────────────────────────────────────────────────────────
  const setGoal = (goal) => {
    if (!currentUser) return;
    currentUser.goal = goal;
    refresh(currentUser);
  };

  // ── 2FA ──────────────────────────────────────────────────────────────────
  const update2FA = (enabled, phone) => {
    if (!currentUser) return;
    currentUser.twoFAEnabled = enabled;
    if (phone) currentUser.phone = phone;
    refresh(currentUser);
  };

  const disconnect = () => {
    if (!currentUser) return;
    const partnerUsername = currentUser.connectedPeerUsername || currentUser.connectedVapeUserUsername;
    if (!partnerUsername) return;
    const partner = registeredUsers.find((u) => u.username === partnerUsername);
    if (partner) {
      partner.connectedPeerUsername = null;
      partner.connectedVapeUserUsername = null;
      partner.vapeUserRelationshipLabel = null;
    }
    currentUser.connectedPeerUsername = null;
    currentUser.connectedVapeUserUsername = null;
    currentUser.peerRelationship = null;
    currentUser.progressSharedWithPeer = false;
    refresh(currentUser);
  };

  // ── MESSAGING ─────────────────────────────────────────────────────────────
  const sendMessage = (toUsername, text) => {
    if (!currentUser || !text.trim()) return;
    messages.push({
      id: uid(),
      fromUsername: currentUser.username,
      toUsername,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setNotifTick((n) => n + 1);
  };

  const getMessages = (withUsername) => {
    if (!currentUser) return [];
    return messages.filter(
      (m) =>
        (m.fromUsername === currentUser.username && m.toUsername === withUsername) ||
        (m.fromUsername === withUsername && m.toUsername === currentUser.username)
    );
  };

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const _pushNotification = ({ toUsername, type, message, requestId, fromUsername, fromDisplayName }) => {
    notifications.push({
      id: uid(), toUsername, type, message,
      requestId: requestId || null,
      fromUsername: fromUsername || null,
      fromDisplayName: fromDisplayName || null,
      read: false,
      timestamp: new Date().toLocaleTimeString(),
    });
    setNotifTick((n) => n + 1);
  };

  const getNotifications = () => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.toUsername === currentUser.username).reverse();
  };

  const markAllRead = () => {
    notifications.forEach((n) => { if (n.toUsername === currentUser?.username) n.read = true; });
    setNotifTick((n) => n + 1);
  };

  const getUnreadCount = () =>
    notifications.filter((n) => n.toUsername === currentUser?.username && !n.read).length;

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const getConnectedVapeUser = () => {
    if (!currentUser) return null;
    const u = currentUser.connectedVapeUserUsername;
    return u ? registeredUsers.find((x) => x.username === u) || null : null;
  };

  const getConnectedPeer = () => {
    if (!currentUser) return null;
    const u = currentUser.connectedPeerUsername;
    return u ? registeredUsers.find((x) => x.username === u) || null : null;
  };

  const getPendingRequestsForMe = () => {
    if (!currentUser) return [];
    return connectionRequests.filter(
      (r) => r.toUsername === currentUser.username && r.status === 'pending'
    );
  };

  const logout = () => {
    clearAuthToken();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{
      currentUser, notifTick,
      register, login, setRole, saveDetails,
      logMoodEntry, deleteLogEntry,
      sendConnectionRequest, respondToRequest, disconnect,
      sendMessage, getMessages,
      getNotifications, markAllRead, getUnreadCount,
      getConnectedVapeUser, getConnectedPeer, getPendingRequestsForMe,
      setGoal, update2FA,
      getRewardDefs, getUnlockedIds,
      checkAndUnlockRewards: _checkAndUnlockRewards,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
