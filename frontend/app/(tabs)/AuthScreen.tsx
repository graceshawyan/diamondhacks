import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import useColorScheme from '../hooks/useColorScheme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from './AppNavigator';

type AuthMode = 'login' | 'register';

type AuthScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Auth'>;
};

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleAuth = () => {
    if (mode === 'login') {
      // Handle login logic
      console.log('Logging in with:', { email, password });
      // Navigate to main app
      navigation.navigate('Main');
    } else {
      // Handle registration logic
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      console.log('Registering with:', { username, email, password });
      // Navigate to about me screen
      navigation.navigate('AboutMe');
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    // Clear fields when switching modes
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 p-6 justify-center">
            <View className="items-center mb-10">
              <Text className="text-4xl font-bold text-teal-600 font-mono">Recoverly</Text>
              <Text className="text-base text-gray-500 mt-2">The Strava for Disease Recovery</Text>
            </View>

            <View className="w-full">
              <Text className={`text-2xl font-bold text-center mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </Text>

              {mode === 'register' && (
                <View className="mb-4">
                  <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Username</Text>
                  <TextInput
                    className={`border rounded-lg p-3 text-base ${
                      isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                    }`}
                    placeholder="Enter your username"
                    placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View className="mb-4">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Email</Text>
                <TextInput
                  className={`border rounded-lg p-3 text-base ${
                    isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                  }`}
                  placeholder="Enter your email"
                  placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View className="mb-4">
                <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Password</Text>
                <TextInput
                  className={`border rounded-lg p-3 text-base ${
                    isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                  }`}
                  placeholder="Enter your password"
                  placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              {mode === 'register' && (
                <View className="mb-4">
                  <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Confirm Password</Text>
                  <TextInput
                    className={`border rounded-lg p-3 text-base ${
                      isDark ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-300 bg-gray-50 text-gray-900'
                    }`}
                    placeholder="Confirm your password"
                    placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              )}

              <TouchableOpacity
                className="bg-teal-600 rounded-lg py-3 mt-6"
                onPress={handleAuth}
              >
                <Text className="text-white text-center text-lg font-bold">
                  {mode === 'login' ? 'Login' : 'Register'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 items-center"
                onPress={toggleMode}
              >
                <Text className={`${isDark ? 'text-teal-400' : 'text-teal-600'} text-base underline`}>
                  {mode === 'login'
                    ? "Don't have an account? Sign up"
                    : 'Already have an account? Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}