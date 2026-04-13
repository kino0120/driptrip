import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import FeedScreen from '../screens/FeedScreen';
import PostScreen from '../screens/PostScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import EditPostScreen from '../screens/EditPostScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6B4226',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#F0F0F0' },
        headerStyle: { backgroundColor: '#FAFAF8' },
        headerTitleStyle: { fontWeight: '700', color: '#1A1A1A' },
        headerShadowVisible: false,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: 'フィード', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>☕</Text> }}
      />
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{ title: '投稿', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>✏️</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'プロフィール', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌱</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'ログイン', presentation: 'modal' }} />
        <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: '投稿を編集', presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
