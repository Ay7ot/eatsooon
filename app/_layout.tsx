import { LanguageProvider } from '@/src/localization/LanguageContext';
import { AuthProvider } from '@/src/services/AuthContext';
import { registerBackgroundTask, testBackgroundTask } from '@/src/services/backgroundTaskService';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import i18n configuration
import '@/src/localization/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'Inter-Regular': require('@/src/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/src/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/src/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@/src/assets/fonts/Inter-Bold.ttf'),
    'Nunito-Regular': require('@/src/assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Medium': require('@/src/assets/fonts/Nunito-Medium.ttf'),
    'Nunito-SemiBold': require('@/src/assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('@/src/assets/fonts/Nunito-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      registerBackgroundTask();

      // Test the background task functionality (for development/testing)
      // Remove this in production
      // Delay longer to give user time to authenticate
      setTimeout(() => {
        console.log('🧪 Running notification test in 10 seconds...');
        testBackgroundTask();
      }, 10000); // Test after 10 seconds
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="recipe-detail" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
