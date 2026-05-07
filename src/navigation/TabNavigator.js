import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { C } from '../theme/design';

import HomeScreen from '../screens/new/HomeScreen';
import ChatScreen from '../screens/new/ChatScreen';
import StonesScreen from '../screens/new/StonesScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, label, focused }) {
  return (
    <View style={s.tabItem}>
      <Text style={[s.tabIcon, focused && s.tabIconActive]}>{icon}</Text>
      <Text style={[s.tabLabel, focused && s.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabNavigator({ kundliData, userData, language }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="☰" label="HOME" focused={focused} />,
        }}
      >
        {(props) => <HomeScreen {...props} kundliData={kundliData} userData={userData} language={language} />}
      </Tab.Screen>

      <Tab.Screen
        name="Chat"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="○" label="CHAT" focused={focused} />,
        }}
      >
        {(props) => <ChatScreen {...props} kundliData={kundliData} language={language} />}
      </Tab.Screen>

      <Tab.Screen
        name="Stones"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="◇" label="STONES" focused={focused} />,
        }}
      >
        {(props) => <StonesScreen {...props} kundliData={kundliData} language={language} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: C.void,
    borderTopWidth: 0.5,
    borderTopColor: C.b1,
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIcon: {
    fontSize: 16,
    color: C.t3,
  },
  tabIconActive: {
    color: C.t1,
  },
  tabLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: C.t4,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: C.t2,
  },
});