import { Tabs } from 'expo-router';
import { Colors, IconSizes } from '../../styles/theme';
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
          tabBarIcon: () => (
            <Entypo name="home" size={IconSizes.medium} color={Colors.accent}/>
          ),
        }}
      />
      <Tabs.Screen
        name="category"
        options={{
          title: 'Category',
          tabBarIcon: () => (
            <AntDesign name="appstore" size={IconSizes.medium} color={Colors.accent}/>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: () => (
            <AntDesign name="plus-circle" size={IconSizes.medium} color={Colors.accent} />
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plants',
          tabBarIcon: () => (
            <Entypo name="leaf" size={IconSizes.medium} color={Colors.accent}/>
          ),
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Wellness',
          tabBarIcon: () => (
            <MaterialCommunityIcons name="brain" size={IconSizes.medium} color={Colors.accent}/>
          ),
        }}
      />
    </Tabs>
  );
}
