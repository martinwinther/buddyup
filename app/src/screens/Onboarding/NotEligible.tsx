import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function NotEligible() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View className="flex-1 bg-[#0a0a0a] px-6 pt-16 pb-8">
      <View className="flex-1 justify-center items-center">
        <View className="w-20 h-20 rounded-full bg-red-500/20 items-center justify-center mb-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        </View>

        <Text className="text-white text-3xl font-bold mb-4 text-center">
          Age Requirement Not Met
        </Text>

        <Text className="text-white/60 text-base text-center mb-8 max-w-sm">
          You must be at least 18 years old to use this service. 
          Thank you for your interest.
        </Text>

        <TouchableOpacity
          className="rounded-2xl py-4 px-8 bg-white/10 border border-white/20"
          onPress={handleSignOut}
        >
          <Text className="text-white text-center text-base font-semibold">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

