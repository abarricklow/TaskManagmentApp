import { Tabs } from 'expo-router';
import { Colors, IconSizes, GlobalStyles } from '../styles/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
      tabBarShowLabel: false,
      tabBarActiveTintColor: Colors.accent,
      headerStyle: {
        backgroundColor: Colors.background,
      },
      headerShadowVisible: true,
      tabBarStyle: {
        backgroundColor: Colors.background,
      },
    }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Entypo name="home" size={IconSizes.medium} color={color}/>
          ),
        }}
      />
      <Tabs.Screen
        name="category"
        options={{
          title: 'Category',
          tabBarIcon: ({ color, focused }) => (
            <AntDesign name="appstore" size={IconSizes.medium} color={color}/>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <AntDesign name="plus-circle" size={IconSizes.medium} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plants',
          tabBarIcon: ({ color, focused }) => (
            <Entypo name="leaf" size={IconSizes.medium} color={color}/>
          ),
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Wellness',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="brain" size={IconSizes.medium} color={color}/>
          ),
        }}
      />
    </Tabs>
  );
}
