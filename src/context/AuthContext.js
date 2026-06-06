import React, { createContext, useContext, useState } from 'react';

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
  const register = ({ email, username, password }) => {
    const emailLower = email.trim().toLowerCase();
    const usernameLower = username.trim().toLowerCase();
    const exists = registeredUsers.find(
      (u) => u.email === emailLower || u.username === usernameLower
    );
    if (exists) {
      if (exists.email === emailLower) return { success: false, error: 'Email is already registered.' };
      return { success: false, error: 'Username is already taken.' };
    }
    const newUser = {
      id: uid(),
      email: emailLower,
      username: usernameLower,
      password,
      role: '',
      firstName: '', lastName: '', middleName: '', suffix: '',
      birthday: '', age: '', gender: '',
      streak: 0, totalPoints: 0,
      moodLogs: [],
      lastRelapseRisk: 0,
      profileComplete: false,
      // Connection fields
      connectedPeerUsername: null,
      connectedVapeUserUsername: null,
      peerRelationship: null,       // 'Friend' | 'Family' | 'Partner' | 'Colleague' | 'Other'
      progressSharedWithPeer: false,
    };
    registeredUsers.push(newUser);
    setCurrentUser(newUser);
    return { success: true, user: newUser };
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  // FIX: Login goes straight to Dashboard if profileComplete — no re-asking for details
  const login = ({ identifier, password }) => {
    const id = identifier.trim().toLowerCase();
    const user = registeredUsers.find(
      (u) => (u.email === id || u.username === id) && u.password === password
    );
    if (!user) return { success: false, error: 'Invalid credentials. Please check and try again.' };
    setCurrentUser(user);
    return { success: true, user };
  };

  const setRole = (role) => {
    if (!currentUser) return;
    currentUser.role = role;
    refresh(currentUser);
  };

  const saveDetails = ({ firstName, lastName, middleName, suffix, birthday, age, gender }) => {
    if (!currentUser) return;
    Object.assign(currentUser, {
      firstName, lastName, middleName, suffix, birthday, age, gender,
      profileComplete: true,
    });
    refresh(currentUser);
  };

  const setGoal = (goalData) => {
  if (!currentUser) return;

  currentUser.goal = goalData;

  refresh(currentUser);
};

  // ── LOG MOOD ENTRY ────────────────────────────────────────────────────────
  const logMoodEntry = ({ mood, triggers, craving, vaped }) => {
    if (!currentUser) return { error: 'Not logged in' };
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
          message: `${displayName} logged ${mood.toLowerCase()} mood with ${relapseRisk}% relapse risk. They may need support.`,
        });
      }
      if (vaped) {
        _pushNotification({
          toUsername: peerUsername, type: 'vaped',
          message: `${displayName} reported vaping today. Consider reaching out.`,
        });
      }
    }

    refresh(currentUser);
    return { success: true, pointsEarned, newStreak, relapseRisk, entryId: entry.id };
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
          message: `${to.firstName || to.username} accepted your connection request! You are now their peer supporter.`,
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

  const logout = () => setCurrentUser(null);

  return (
    <AuthContext.Provider value={{
      currentUser, notifTick,
      register, login, setRole, saveDetails,
      logMoodEntry, deleteLogEntry,
      sendConnectionRequest, respondToRequest, disconnect,
      sendMessage, getMessages,
      getNotifications, markAllRead, getUnreadCount,
      getConnectedVapeUser, getConnectedPeer, getPendingRequestsForMe,
      logout, setGoal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
