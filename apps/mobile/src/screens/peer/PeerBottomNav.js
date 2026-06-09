import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { colors } from '../../theme';

const TABS = [
  {
    key: 'Dashboard',
    icon: require('../../../assets/icons/home.png'),
    label: 'Home',
    screen: 'PeerDashboard',
  },
  {
    key: 'Notifications',
    icon: require('../../../assets/icons/alerts.png'),
    label: 'Alerts',
    screen: 'PeerNotifications',
  },
  {
    key: 'Messaging',
    icon: require('../../../assets/icons/messages.png'),
    label: 'Messages',
    screen: 'PeerMessaging',
  },
  {
    key: 'Profile',
    icon: require('../../../assets/icons/profile.png'),
    label: 'Profile',
    screen: 'PeerProfile',
  },
];

export default function PeerBottomNav({ active, navigation, unread = 0 }) {
  return (
    <View style={styles.nav}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.item, active === tab.key && styles.itemActive]}
          onPress={() => navigation.navigate(tab.screen)}
          activeOpacity={0.7}
        >
          <View>
            <Image source={tab.icon} style={styles.icon} />
            {tab.key === 'Notifications' && unread > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
            )}
          </View>
          <Text style={[styles.label, active === tab.key && styles.labelActive]}>{tab.label}</Text>
          {active === tab.key && <View style={styles.dot} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', backgroundColor: 'rgba(20,10,45,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(181,125,218,0.28)', paddingBottom: 24, paddingTop: 10 },
  item: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 4, borderRadius: 12, marginHorizontal: 4 },
  itemActive: { backgroundColor: 'rgba(181,125,218,0.15)' },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  label: { fontSize: 10, color: 'rgba(170,160,187,1)', fontWeight: '500' },
  labelActive: { color: '#B57DDA' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#B57DDA' },
  badge: { position: 'absolute', top: -4, right: -6, backgroundColor: '#E07070', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
