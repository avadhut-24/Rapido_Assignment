import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RideListingScreen from '../screens/RideListingScreen';
import CreateRideScreen from '../screens/CreateRideScreen';
import EditRideScreen from '../screens/EditRideScreen';
import RideDetailScreen from '../screens/RideDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminPendingRidesScreen from '../screens/AdminPendingRidesScreen';
import AdminAllRidesScreen from '../screens/AdminAllRidesScreen';
import AdminAnalyticsScreen from '../screens/AdminAnalyticsScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Loading screen component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#2196F3" />
  </View>
);

// Tab navigator for regular users
const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Rides') {
            iconName = 'directions-car';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Rides" 
        component={RideListingScreen}
        options={{
          title: 'My Rides',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Tab navigator for admin users
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Pending') {
            iconName = 'schedule';
          } else if (route.name === 'AllRides') {
            iconName = 'list';
          } else if (route.name === 'Analytics') {
            iconName = 'analytics';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Pending" 
        component={AdminPendingRidesScreen}
        options={{
          title: 'Pending Rides',
        }}
      />
      <Tab.Screen 
        name="AllRides" 
        component={AdminAllRidesScreen}
        options={{
          title: 'All Rides',
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AdminAnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Main app navigator
const AppNavigator = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Determine if user is admin
  const isAdmin = user?.role === 'ADMIN';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // Authenticated stack
          <>
            <Stack.Screen 
              name="Main" 
              component={isAdmin ? AdminTabNavigator : UserTabNavigator} 
            />
            <Stack.Screen 
              name="CreateRide" 
              component={CreateRideScreen}
              options={{
                headerShown: true,
                title: 'Create New Ride',
                headerStyle: {
                  backgroundColor: '#2196F3',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen 
              name="EditRide" 
              component={EditRideScreen}
              options={{
                headerShown: true,
                title: 'Edit Ride',
                headerStyle: {
                  backgroundColor: '#2196F3',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
            <Stack.Screen 
              name="RideDetail" 
              component={RideDetailScreen}
              options={{
                headerShown: true,
                title: 'Ride Details',
                headerStyle: {
                  backgroundColor: '#2196F3',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </>
        ) : (
          // Authentication stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen}
              options={{
                headerShown: true,
                title: 'Create Account',
                headerStyle: {
                  backgroundColor: '#2196F3',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 