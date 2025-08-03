import { LanguageProvider } from '@/src/localization/LanguageContext';
import { adMobService } from '@/src/services/AdMobService';
import { AuthProvider } from '@/src/services/AuthContext';
import { AuthGate } from '@/src/services/AuthGate';
import { registerBackgroundTask } from '@/src/services/backgroundTaskService';
import { expiryNotificationService } from '@/src/services/ExpiryNotificationService';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
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

      // Initialize AdMob
      adMobService.initialize();

      // Initialize expiry notifications
      expiryNotificationService.setupNotificationChannels();
      expiryNotificationService.checkAndScheduleNotifications();

      // Set up notification received listener to mark notifications as delivered
      const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
        console.log(`📱 [App] Notification received: ${notification.request.identifier}`);

        // Check if this is an expiry notification
        if (notification.request.content.data?.type === 'expiry-alert') {
          const notificationId = notification.request.identifier;
          console.log(`📱 [App] Marking expiry notification as delivered: ${notificationId}`);
          expiryNotificationService.markNotificationAsDeliveredPublic(notificationId);
        }
      });

      // Set up notification response listener (when user taps notification)
      const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(`📱 [App] Notification response received: ${response.notification.request.identifier}`);

        // Check if this is an expiry notification
        if (response.notification.request.content.data?.type === 'expiry-alert') {
          const notificationId = response.notification.request.identifier;
          console.log(`📱 [App] Marking expiry notification as delivered (tapped): ${notificationId}`);
          expiryNotificationService.markNotificationAsDeliveredPublic(notificationId);
        }
      });

      // Cleanup listeners on unmount
      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <AuthGate>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="recipe-detail" options={{ presentation: 'modal' }} />
              <Stack.Screen name="product-confirmation" />
              <Stack.Screen name="family-members" />
              <Stack.Screen name="inventory-item-detail" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="edit-profile" />
            </Stack>
          </AuthGate>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
