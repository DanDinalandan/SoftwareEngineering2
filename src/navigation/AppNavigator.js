import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Auth
import HomeScreen       from '../screens/HomeScreen';
import SignUpScreen     from '../screens/SignUpScreen';
import LoginScreen      from '../screens/LoginScreen';
import SelectionScreen  from '../screens/SelectionScreen';
import DetailsScreen    from '../screens/DetailsScreen';

// Vape User
import DashboardScreen  from '../screens/DashboardScreen';
import MoodScreen       from '../screens/MoodScreen';
import RewardsScreen    from '../screens/RewardsScreen';
import SupportScreen    from '../screens/SupportScreen';
import ProfileScreen    from '../screens/ProfileScreen';
import CalendarScreen   from '../screens/vapeuser/CalendarScreen';
import GoalsScreen      from '../screens/vapeuser/GoalsScreen';
import SecurityScreen   from '../screens/vapeuser/SecurityScreen';
import VapeUserNotificationsScreen from '../screens/vapeuser/VapeUserNotificationsScreen';

// Peer
import PeerDashboardScreen      from '../screens/peer/PeerDashboardScreen';
import PeerNotificationsScreen  from '../screens/peer/PeerNotificationsScreen';
import PeerMessagingScreen      from '../screens/peer/PeerMessagingScreen';
import PeerProfileScreen        from '../screens/peer/PeerProfileScreen';

import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const SO = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.lavender,
  headerTitleStyle: { fontWeight: '700', color: colors.text },
  headerBackTitleVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

// Smart router: sends Peer → PeerDashboard, Vape User → VapeUserDashboard
function SmartDashboard({ navigation }) {
  const { currentUser } = useAuth();
  React.useEffect(() => {
    if (!currentUser) { navigation.replace('Home'); return; }
    navigation.replace(currentUser.role === 'Peer' ? 'PeerDashboard' : 'VapeUserDashboard');
  }, []);
  return null;
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={SO}>
        {/* ── Auth ── */}
        <Stack.Screen name="Home"      component={HomeScreen}     options={{ headerShown: false }} />
        <Stack.Screen name="SignUp"    component={SignUpScreen}   options={{ title: 'Create Account' }} />
        <Stack.Screen name="Login"     component={LoginScreen}    options={{ title: 'Login' }} />
        <Stack.Screen name="Selection" component={SelectionScreen} options={{ title: 'Select Role', headerBackVisible: false }} />
        <Stack.Screen name="Details"   component={DetailsScreen}  options={{ headerShown: false }} />

        {/* ── Smart router ── */}
        <Stack.Screen name="Dashboard" component={SmartDashboard} options={{ headerShown: false, gestureEnabled: false }} />

        {/* ── Vape User ── */}
        <Stack.Screen name="VapeUserDashboard" component={DashboardScreen}  options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="Mood"              component={MoodScreen}       options={{ headerShown: false }} />
        <Stack.Screen name="Rewards"           component={RewardsScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="Support"           component={SupportScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="Profile"           component={ProfileScreen}    options={{ headerShown: false }} />
        <Stack.Screen name="Calendar"          component={CalendarScreen}   options={{ headerShown: false }} />
        <Stack.Screen name="Goals"             component={GoalsScreen}      options={{ headerShown: false }} />
        <Stack.Screen name="Security"          component={SecurityScreen}   options={{ headerShown: false }} />
        <Stack.Screen name="Notifications"     component={VapeUserNotificationsScreen} options={{ headerShown: false }} />

        {/* ── Peer ── */}
        <Stack.Screen name="PeerDashboard"     component={PeerDashboardScreen}     options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="PeerNotifications" component={PeerNotificationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PeerMessaging"     component={PeerMessagingScreen}     options={{ headerShown: false }} />
        <Stack.Screen name="PeerProfile"       component={PeerProfileScreen}       options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
