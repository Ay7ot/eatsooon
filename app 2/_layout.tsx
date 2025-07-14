import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated/lib/typescript/Animated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LanguageProvider } from '@/src/localization/LanguageContext';
import { AuthProvider, useAuth } from '@/src/services/AuthContext';
import { AuthGate } from '@/src/services/AuthGate';
import { notificationService } from '@/src/services/notifications/NotificationService';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

// Import i18n configuration
import '@/src/localization/i18n';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const BACKGROUND_NOTIFICATION_TASK = 'background-notification-task';

// Define the background task using the modern expo-background-task API
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async () => {
  try {
    console.log('Running background notification task...');
    await notificationService.scheduleInventoryNotifications();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('Background notification task failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

async function registerBackgroundTaskAsync() {
  try {
    // Check if the task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);

    if (!isRegistered) {
      await BackgroundTask.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK, {
        minimumInterval: 12 * 60, // Check every 12 hours (720 minutes)
      });
      console.log('Background task registered successfully');
    } else {
      console.log('Background task already registered');
    }
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is signed in
        router.replace('/(tabs)');
      } else {
        // User is not signed in
        router.replace('/(auth)/sign-in');
      }
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Initialize notification service
    notificationService.registerForPushNotificationsAsync();

    // Register background task
    registerBackgroundTaskAsync();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="recipe-detail" options={{ presentation: 'modal' }} />
      <Stack.Screen name="inventory-item-detail" options={{ presentation: 'modal' }} />
      <Stack.Screen name="product-confirmation" options={{ presentation: 'modal' }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="family-members" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
            <RootLayoutNav />
          </AuthGate>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
