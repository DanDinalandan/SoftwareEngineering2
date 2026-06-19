import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, setAuthToken, clearAuthToken } from '../services/api';
import { getDeviceTimezone, getLocalDateString } from '../utils/time';

/**
 * Auth context — all functions now use real API calls.
 * See BACKEND_README.md for full API spec.
 */
const connectionRequests = [];
const messages = [];

const AuthContext = createContext(null);

const createEmptyMoodDraft = () => ({
  mood: null,
  triggers: [],
  otherTrigger: '',
  craving: 0,
  vaped: null,
  puffCount: 0,
  vaperSessions: [],
  currentSession: { timeSlotId: null, durationId: null },
  comment: '',
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifTick, setNotifTick] = useState(0);
  const [moodDraft, setMoodDraft] = useState(createEmptyMoodDraft);
  const [notifications, setNotifications] = useState([]);
  const [messagesCache, setMessagesCache] = useState({}); // { username: [messages] }
  const [rewards, setRewards] = useState([]);
  const [connectedVapeUser, setConnectedVapeUser] = useState(null);

  const refresh = (user) => {
    setCurrentUser({ ...user });
    setNotifTick((n) => n + 1);
  };

  // Fetch notifications whenever the logged-in user changes
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      fetchRewards();
      fetchConnectedVapeUser();
    } else {
      setNotifications([]);
      setRewards([]);
      setConnectedVapeUser(null);
    }
  }, [currentUser?.id]);

  // Poll for new notifications every 5 seconds
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => fetchNotifications(), 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const register = async ({ email, username, password, phone = '', role = '' }) => {
    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, username, password, phone, role }),
      });
      setAuthToken(data.token);
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  const login = async ({ identifier, password, role = '' }) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password, role }),
      });
      setAuthToken(data.token);
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const forgotPassword = async ({ identifier, phone, password }) => {
    try {
      const data = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ identifier, phone, password }),
      });
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const setRole = async (role) => {
    if (!currentUser) return;
    try {
      const data = await apiRequest('/user/role', {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Error setting role:', err);
      return { success: false, error: err.message };
    }
  };

  const saveDetails = async ({ firstName, lastName, middleName, suffix, birthday, age, gender, vapeTypes = [] }) => {
    if (!currentUser) return;
    try {
      const data = await apiRequest('/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName, middleName, suffix, birthday, age, gender, vapeTypes }),
      });
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Error saving details:', err);
      return { success: false, error: err.message };
    }
  };

  // ── REFRESH USER DATA ─────────────────────────────────────────────────────
  // Calls /user/me to re-fetch the latest user data from the backend,
  // which updates streak, moodLogs, totalPoints, lastRelapseRisk, etc.
  const refreshUser = async () => {
    if (!currentUser) return;
    try {
      const [userData] = await Promise.all([
        apiRequest('/user/me', { method: 'GET' }),
        fetchNotifications(),
        fetchRewards(),
      ]);
      setCurrentUser(userData.user);
      await fetchConnectedVapeUser(userData.user);
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  // ── LOG MOOD ENTRY ────────────────────────────────────────────────────────
  const logMoodEntry = async ({
    mood, triggers, craving, vaped,
    vapeMinutes = 0, puffsToday = 0, vapedHour = null,
    vapedSessions = [], totalVapingMinutes = null,
    comment = '',
  }) => {
    if (!currentUser) return { error: 'Not logged in' };
    try {
      const data = await apiRequest('/mood', {
        method: 'POST',
        body: JSON.stringify({
          mood, triggers, craving, vaped,
          vapeMinutes: vaped ? (totalVapingMinutes ?? vapeMinutes) : 0,
          vapedSessions: vaped ? vapedSessions : [],
          puffsToday: vaped ? puffsToday : 0,
          vapedHour: vaped ? vapedHour : null,
          comment,
          timezone: getDeviceTimezone(),
          clientTimezone: getDeviceTimezone(),
          localDate: getLocalDateString(),
        }),
      });
      // FIX: Re-fetch real data from DB instead of ghost local state update
      await refreshUser();
      return { success: true, ...data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── DELETE LOG ENTRY ──────────────────────────────────────────────────────
  const deleteLogEntry = async (entryId) => {
    if (!currentUser) return;
    try {
      await apiRequest(`/mood/${entryId}`, { method: 'DELETE' });
      // FIX: Re-fetch real data from DB after delete instead of ghost local state
      await refreshUser();
    } catch (err) {
      console.error('Error deleting log:', err);
    }
  };

  // ── REWARD SYSTEM ─────────────────────────────────────────────────────────
  const fetchRewards = async () => {
    if (!currentUser || currentUser.role !== 'Vape User') {
      setRewards([]);
      return [];
    }
    try {
      const data = await apiRequest('/rewards', { method: 'GET' });
      const nextRewards = data.rewards || [];
      setRewards(nextRewards);
      return nextRewards;
    } catch (err) {
      console.error('Error fetching rewards:', err);
      return [];
    }
  };

  const getRewardDefs = () => rewards;
  const getUnlockedIds = () => rewards.filter((reward) => reward.unlocked).map((reward) => reward.id);

  // ── PEER CONNECTION ───────────────────────────────────────────────────────
  const sendConnectionRequest = async (toUsername) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    try {
      await apiRequest('/connections/request', {
        method: 'POST',
        body: JSON.stringify({ toUsername }),
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const respondToRequest = async (requestId, accept, relationship = null) => {
    try {
      const data = await apiRequest(`/connections/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ accept, relationship }),
      });
      // Remove the notification from local state immediately
      setNotifications((prev) => prev.filter((n) => n.requestId !== requestId));
      // Refresh user data and fetch fresh notifications from backend
      await refreshUser();
      await fetchNotifications();
      return { success: true, ...data };
    } catch (err) {
      console.error('Error responding to request:', err);
      throw err;
    }
  };

  const respondToProviderRequest = async (requestId, accept) => {
    try {
      const data = await apiRequest(`/provider-connections/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ accept }),
      });
      setNotifications((prev) => prev.filter((n) => n.providerRequestId !== requestId));
      await refreshUser();
      await fetchNotifications();
      return { success: true, ...data };
    } catch (err) {
      console.error('Error responding to provider request:', err);
      throw err;
    }
  };

  const disconnect = async () => {
    if (!currentUser) return;
    try {
      await apiRequest('/connections', { method: 'DELETE' });
      setMessagesCache({});
      await refreshUser();
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  // ── MESSAGING ─────────────────────────────────────────────────────────────
  const sendMessage = async (toUsername, text) => {
    if (!currentUser || !text.trim()) return;
    try {
      await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({ toUsername, text: text.trim(), clientTimezone: getDeviceTimezone() }),
      });
      // Refresh messages after sending
      await fetchMessages(toUsername);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const fetchMessages = async (withUsername) => {
    if (!currentUser) return [];
    try {
      const data = await apiRequest(`/messages/${withUsername}`);
      const msgs = data.messages || [];
      setMessagesCache((prev) => ({ ...prev, [withUsername]: msgs }));
      return msgs;
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  };

  const getMessages = (withUsername) => {
    // Return cached messages immediately, fetch fresh data in background
    if (withUsername) {
      fetchMessages(withUsername); // Fire and forget
    }
    return messagesCache[withUsername] || [];
  };

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (!currentUser || !currentUser.id) return;
    try {
      const data = await apiRequest('/notifications', { method: 'GET' });
      const normalized = (data.notifications || []).map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        title: n.title,
        icon: n.icon,
        requestId: n.request_id, // Convert snake_case to camelCase
        providerRequestId: n.provider_request_id,
        fromUserId: n.from_user_id,
        fromProviderId: n.from_provider_id,
        fromDisplayName: n.from_display_name,
        read: n.read,
        timestamp: n.display_timestamp,
      }));
      setNotifications(normalized);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const getNotifications = () => notifications;

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setNotifTick((n) => n + 1);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const getUnreadCount = () => notifications.filter((n) => !n.read).length;

  const updateMoodDraft = (patch) => {
    setMoodDraft((draft) => ({ ...draft, ...patch }));
  };

  const clearMoodDraft = () => {
    setMoodDraft(createEmptyMoodDraft());
  };

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const fetchConnectedVapeUser = async (baseUser = currentUser) => {
    if (!baseUser || baseUser.role !== 'Peer' || !baseUser.connectedVapeUserUsername) {
      setConnectedVapeUser(null);
      return null;
    }
    try {
      const data = await apiRequest('/connections/peer-user', { method: 'GET' });
      const user = data.user ? {
        ...data.user,
        moodLogs: data.moodLogs || [],
        lastRelapseRisk: data.lastRelapseRisk || data.user.lastRelapseRisk || 0,
      } : null;
      setConnectedVapeUser(user);
      return user;
    } catch (err) {
      setConnectedVapeUser(null);
      return null;
    }
  };

  const getConnectedVapeUser = () => {
    if (!currentUser) return null;
    return connectedVapeUser || (currentUser.connectedVapeUserUsername ? { username: currentUser.connectedVapeUserUsername } : null);
  };

  const getConnectedPeer = () => {
    if (!currentUser) return null;
    return currentUser.connectedPeerUsername ? { username: currentUser.connectedPeerUsername } : null;
  };

  const getPendingRequestsForMe = () => connectionRequests || [];

  const logout = () => {
    clearAuthToken();
    clearMoodDraft();
    setCurrentUser(null);
  };

  const setGoal = async (goal) => {
    if (!currentUser) return;
    try {
      const data = await apiRequest('/user/goal', {
        method: 'PUT',
        body: JSON.stringify(goal),
      });
      setCurrentUser(data.user);
      await fetchRewards();
    } catch (err) {
      console.error('Error setting goal:', err);
    }
  };

  const updatePhone = async (phone) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    try {
      const data = await apiRequest('/user/phone', {
        method: 'PATCH',
        body: JSON.stringify({ phone }),
      });
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const update2FA = async (enabled, phone) => {
    if (!currentUser) return;
    try {
      if (enabled) {
        const data = await apiRequest('/auth/send-otp', {
          method: 'POST',
          body: JSON.stringify({ phone }),
        });
        return { success: true, devOtp: data.devOtp };
      }
      const data = await apiRequest('/auth/2fa', { method: 'DELETE' });
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Error updating 2FA:', err);
      return { success: false, error: err.message };
    }
  };

  const verify2FA = async (otp) => {
    if (!currentUser) return { success: false, error: 'Not logged in' };
    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp }),
      });
      setCurrentUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetProgress = async () => {
    if (!currentUser) return { success: false };
    try {
      await apiRequest('/user/progress/reset', { method: 'POST' });
      clearMoodDraft();
      refresh(currentUser);
      return { success: true };
    } catch (err) {
      console.error('Error resetting progress:', err);
      return { success: false };
    }
  };

  const deleteAccount = async () => {
    if (!currentUser) return { success: false };
    try {
      await apiRequest('/user/account', { method: 'DELETE' });
      clearAuthToken();
      clearMoodDraft();
      setCurrentUser(null);
      return { success: true };
    } catch (err) {
      console.error('Error deleting account:', err);
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser, notifTick, moodDraft, notifications,
      register, login, forgotPassword, setRole, saveDetails,
      refreshUser, fetchNotifications, fetchRewards, fetchConnectedVapeUser,
      logMoodEntry, deleteLogEntry,
      sendConnectionRequest, respondToRequest, respondToProviderRequest, disconnect,
      sendMessage, getMessages,
      getNotifications, markAllRead, getUnreadCount,
      updateMoodDraft, clearMoodDraft,
      getConnectedVapeUser, getConnectedPeer, getPendingRequestsForMe,
      setGoal, update2FA, resetProgress, deleteAccount,
      getRewardDefs, getUnlockedIds,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);