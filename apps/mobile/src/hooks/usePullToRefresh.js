import React, { useCallback, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export function usePullToRefresh(extraRefresh) {
  const {
    currentUser,
    refreshUser,
    fetchNotifications,
    fetchRewards,
    fetchConnectedVapeUser,
  } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const refreshes = [
        refreshUser?.(),
        fetchNotifications?.(),
        currentUser?.role === 'Vape User' ? fetchRewards?.() : null,
        currentUser?.role === 'Peer' ? fetchConnectedVapeUser?.() : null,
        extraRefresh?.(),
      ].filter(Boolean);
      await Promise.all(refreshes);
    } finally {
      setRefreshing(false);
    }
  }, [
    currentUser?.role,
    extraRefresh,
    fetchConnectedVapeUser,
    fetchNotifications,
    fetchRewards,
    refreshUser,
  ]);

  return {
    refreshing,
    onRefresh,
    refreshControl: (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={colors.lavender}
        colors={[colors.lavender]}
      />
    ),
  };
}
