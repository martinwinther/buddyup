import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types';
import { NoticeBanner } from '../../components/NoticeBanner';
import { Routes } from '../../navigation/routes';

type SignInEmailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AuthSignIn'>;
type SignInEmailRouteProp = RouteProp<RootStackParamList, 'AuthSignIn'>;

export default function SignInEmail() {
  const navigation = useNavigation<SignInEmailNavigationProp>();
  const route = useRoute<SignInEmailRouteProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const notice = route.params?.notice;

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithEmail(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Sign In Failed', error.message);
    } else {
      // Successfully signed in - navigation will auto-switch to onboarding stack
      navigation.reset({ 
        index: 0, 
        routes: [{ name: Routes.OnboardingProfile as never }] 
      });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'center' }}>
        <View className="flex-1 bg-[#0a0a0a] px-6 justify-center">
      <View className="mb-8">
        <Text className="text-white text-4xl font-bold mb-2">Welcome back</Text>
        <Text className="text-white/60 text-lg mt-4">
          Sign in to continue
        </Text>
      </View>

      {notice && <NoticeBanner message={notice} type="success" />}

      <View className="space-y-4">
        <View>
          <Text className="text-white/80 text-sm mb-2">Email</Text>
          <TextInput
            className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-base"
            placeholder="you@example.com"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
        </View>

        <View>
          <Text className="text-white/80 text-sm mb-2">Password</Text>
          <TextInput
            className="bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-base"
            placeholder="Your password"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          className={`bg-blue-500 rounded-2xl py-4 mt-6 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          <Text className="text-white text-center text-base font-semibold">
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-white/60 text-sm">Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(Routes.AuthSignUp as never)}>
            <Text className="text-blue-500 text-sm font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

