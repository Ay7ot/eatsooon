import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import i18n from '../localization/i18n';
import { inventoryService } from './InventoryService';

const TASK_NAME = 'check-expiring-items-task';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Set up notification channel for Android
const setupNotificationChannel = async () => {
    if (Platform.OS === 'android') {
        try {
            
            await Notifications.setNotificationChannelAsync('expiring-items', {
                name: i18n.t('notification_channel_name'),
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
                description: i18n.t('notification_channel_description'),
            });

        } catch (error) {
            console.error('❌ Error setting up notification channel:', error);
        }
    } else {
        console.log('📱 iOS - no notification channel setup needed');
    }
};

// Request notification permissions
const requestNotificationPermissions = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('❌ Notification permissions not granted. Status:', finalStatus);
            return false;
        }

        return true;
    } catch (error) {
        console.error('❌ Error requesting notification permissions:', error);
        return false;
    }
};

// Per the Expo docs, this must be defined in the global scope.
TaskManager.defineTask(TASK_NAME, async () => {
    try {
        const expiringItems = await inventoryService.getExpiringSoonItems(3);

        if (expiringItems.length > 0) {
            // Check if we have notification permissions
            const hasPermissions = await requestNotificationPermissions();
            if (!hasPermissions) {
                return BackgroundTask.BackgroundTaskResult.Success;
            }

            // Setup notification channel
            await setupNotificationChannel();

            // Schedule notification with correct trigger format
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: i18n.t('notification_expiring_title'),
                    body: i18n.t('notification_expiring_body', { count: expiringItems.length }),
                    data: {
                        itemCount: expiringItems.length,
                        items: expiringItems.slice(0, 3).map(item => item.name) // Include first 3 item names
                    },
                    sound: 'default',
                },
                trigger: {
                    channelId: 'expiring-items',
                    seconds: 5, // Show notification in 5 seconds for testing
                },
            });

        } else {
            console.log('No expiring items found.');
        }

        return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
        console.error('Background task failed:', error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

/**
 * Registers the background task to run periodically.
 * Per the docs, the interval is a minimum and the OS decides the exact time.
 */
export async function registerBackgroundTask() {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
        if (isRegistered) {
            return;
        }

        // Setup notification permissions and channel first
        await requestNotificationPermissions();
        await setupNotificationChannel();

        await BackgroundTask.registerTaskAsync(TASK_NAME, {
            minimumInterval: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
        });

    } catch (error) {
        console.error('Failed to register background task:', error);
    }
}

/**
 * Unregisters the background task.
 */
export async function unregisterBackgroundTask() {
    try {
        await BackgroundTask.unregisterTaskAsync(TASK_NAME);
    } catch (error) {
        console.error('Failed to unregister background task:', error);
    }
}

// Helper function to create test expiring items for testing
export async function createTestExpiringItems() {
    try {
        const { auth } = await import('./firebase');
        if (!auth.currentUser) {
            return;
        }

        const { familyService } = await import('./FamilyService');
        const familyId = await familyService.getCurrentFamilyId();

        // Create test items that expire in 1, 2, and 3 days
        const testItems = [
            {
                name: 'Test Milk',
                expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
                category: 'dairy',
                quantity: 1,
                unit: 'bottles',
                imageUrl: '',
                familyId: familyId
            },
            {
                name: 'Test Bread',
                expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
                category: 'bakery',
                quantity: 1,
                unit: 'pieces',
                imageUrl: '',
                familyId: familyId
            },
            {
                name: 'Test Yogurt',
                expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
                category: 'dairy',
                quantity: 2,
                unit: 'pcs',
                imageUrl: '',
                familyId: familyId
            }
        ];

        for (const item of testItems) {
            await inventoryService.addFoodItem(item);
        }

    } catch (error) {
        console.error('❌ Error creating test items:', error);
    }
}

/**
 * Test function to manually trigger the background task logic
 */
export async function testBackgroundTask() {
    try {
        // Check if user is authenticated
        const { auth } = await import('./firebase');
        if (!auth.currentUser) {
            return;
        }

        let expiringItems = await inventoryService.getExpiringSoonItems(3);

        if (expiringItems.length > 0) {
            const hasPermissions = await requestNotificationPermissions();
            if (!hasPermissions) {
                return;
            }

            await setupNotificationChannel();

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: i18n.t('notification_test_title'),
                    body: i18n.t('notification_test_body', { count: expiringItems.length }),
                    data: { test: true },
                    sound: 'default',
                },
                trigger: {
                    channelId: 'expiring-items',
                    seconds: 2,
                },
            });

        } else {
            // Create test items first
            await createTestExpiringItems();

            // Wait a moment then check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            expiringItems = await inventoryService.getExpiringSoonItems(3);

            if (expiringItems.length > 0) {
                const hasPermissions = await requestNotificationPermissions();
                if (!hasPermissions) {
                    return;
                }

                await setupNotificationChannel();

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Test Notification - Food Expiring Soon!',
                        body: `You have ${expiringItems.length} items expiring soon`,
                        data: { test: true },
                        sound: 'default',
                    },
                    trigger: {
                        channelId: 'expiring-items',
                        seconds: 2,
                    },
                });

            } else {
                // Create a basic test notification
                const hasPermissions = await requestNotificationPermissions();
                if (!hasPermissions) {
                    return;
                }

                await setupNotificationChannel();

                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Test Notification',
                        body: 'This is a test notification to verify the system works',
                        data: { test: true },
                        sound: 'default',
                    },
                    trigger: {
                        channelId: 'expiring-items',
                        seconds: 2,
                    },
                });

            }
        }
    } catch (error) {
        console.error('❌ Test background task failed:', error);
    }
} 