import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types';
import { Routes } from '../../navigation/routes';

type SignUpEmailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AuthSignUp'>;

export default function SignUpEmail() {
  const navigation = useNavigation<SignUpEmailNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { signUpWithEmail } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    const { data, error } = await signUpWithEmail(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else if (data?.session) {
      // Session created immediately - navigate to onboarding
      navigation.reset({ 
        index: 0, 
        routes: [{ name: Routes.OnboardingProfile as never }] 
      });
    } else {
      // No session yet - show confirmation screen
      setShowConfirmation(true);
    }
  };

  if (showConfirmation) {
    return (
      <View className="flex-1 bg-[#0a0a0a] px-6 justify-center items-center">
        <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6">
          <Text className="text-4xl">✉️</Text>
        </View>
        
        <Text className="text-white text-2xl font-bold text-center mb-4">
          Check Your Email
        </Text>
        
        <Text className="text-white/60 text-base text-center mb-2">
          We've sent a confirmation email to:
        </Text>
        
        <Text className="text-white text-base font-semibold text-center mb-8">
          {email}
        </Text>
        
        <Text className="text-white/60 text-sm text-center mb-8 px-4">
          Click the link in the email to verify your account, then come back here to sign in.
        </Text>

        <TouchableOpacity
          className="bg-blue-500 rounded-2xl py-4 px-8 mb-4"
          onPress={() => navigation.navigate(Routes.AuthSignIn as never, { 
            notice: 'Account created. Please sign in to continue. If email confirmation is required, confirm your email first, then sign in.' 
          } as never)}
        >
          <Text className="text-white text-center text-base font-semibold">
            Go to Sign In
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowConfirmation(false);
            setEmail('');
            setPassword('');
          }}
        >
          <Text className="text-white/60 text-sm">Sign up with different email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0a0a0a] px-6 justify-center">
      <View className="mb-8">
        <Text className="text-white text-4xl font-bold mb-2">Welcome to</Text>
        <Text className="text-white text-4xl font-bold">BuddyUp</Text>
        <Text className="text-white/60 text-lg mt-4">
          Create your account to get started
        </Text>
      </View>

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
            placeholder="Min. 6 characters"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          className={`bg-blue-500 rounded-2xl py-4 mt-6 ${isLoading ? 'opacity-50' : ''}`}
          onPress={handleSignUp}
          disabled={isLoading}
        >
          <Text className="text-white text-center text-base font-semibold">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-white/60 text-sm">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(Routes.AuthSignIn as never)}>
            <Text className="text-blue-500 text-sm font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

