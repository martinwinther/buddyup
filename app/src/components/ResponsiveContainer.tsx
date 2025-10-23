import React from 'react';
import { View, Dimensions } from 'react-native';

type Props = {
  children: React.ReactNode;
};

export default function ResponsiveContainer({ children }: Props) {
  const { width } = Dimensions.get('window');
  
  // On mobile devices (width < 768px), use full width
  // On desktop/tablet (width >= 768px), center with max width
  const isMobile = width < 768;
  
  if (isMobile) {
    return <>{children}</>;
  }
  
  return (
    <View className="flex-1 bg-[#0a0a0a] items-center">
      <View 
        className="w-full max-w-md h-full bg-[#0a0a0a]"
        style={{ 
          maxWidth: 400 // Max width for mobile-like experience on desktop
        }}
      >
        {children}
      </View>
    </View>
  );
}
