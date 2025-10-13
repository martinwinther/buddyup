import { View, Text, Image, ViewProps } from 'react-native';

interface GlassCardProps extends ViewProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  categories?: string[];
}

export default function GlassCard({ 
  title, 
  subtitle, 
  imageUrl, 
  categories = [], 
  className, 
  ...props 
}: GlassCardProps) {
  return (
    <View
      className={`bg-zinc-900/60 backdrop-blur-lg rounded-glass-lg border border-white/20 overflow-hidden shadow-lg ${className || ''}`}
      {...props}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-64 rounded-t-glass-lg"
          resizeMode="cover"
        />
      )}
      
      <View className="p-6">
        {title && (
          <Text className="text-2xl font-semibold text-zinc-100 mb-2">
            {title}
          </Text>
        )}
        
        {subtitle && (
          <Text className="text-base text-zinc-400 mb-4">
            {subtitle}
          </Text>
        )}
        
        {categories.length > 0 && (
          <View className="flex-row flex-wrap gap-2">
            {categories.map((category, index) => (
              <View
                key={index}
                className="bg-teal-400/20 px-3 py-1.5 rounded-full border border-teal-400/30"
              >
                <Text className="text-sm text-teal-400 font-medium">
                  {category}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

