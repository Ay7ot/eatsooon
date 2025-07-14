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
            console.log('🔔 Setting up Android notification channel...');

            await Notifications.setNotificationChannelAsync('expiring-items', {
                name: i18n.t('notification_channel_name'),
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
                sound: 'default',
                description: i18n.t('notification_channel_description'),
            });

            console.log('✅ Android notification channel set up');
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
        console.log('🔔 Checking notification permissions...');

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        console.log('📱 Current notification status:', existingStatus);

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            console.log('📱 Requesting notification permissions...');
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
            console.log('📱 New notification status:', finalStatus);
        }

        if (finalStatus !== 'granted') {
            console.warn('❌ Notification permissions not granted. Status:', finalStatus);
            return false;
        }

        console.log('✅ Notification permissions granted');
        return true;
    } catch (error) {
        console.error('❌ Error requesting notification permissions:', error);
        return false;
    }
};

// Per the Expo docs, this must be defined in the global scope.
TaskManager.defineTask(TASK_NAME, async () => {
    try {
        console.log('Background task running at:', new Date());

        const expiringItems = await inventoryService.getExpiringSoonItems(3);

        if (expiringItems.length > 0) {
            // Check if we have notification permissions
            const hasPermissions = await requestNotificationPermissions();
            if (!hasPermissions) {
                console.log('No notification permissions, skipping notification');
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

            console.log(`Notification scheduled for ${expiringItems.length} expiring items.`);
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
            console.log('Background task already registered');
            return;
        }

        // Setup notification permissions and channel first
        await requestNotificationPermissions();
        await setupNotificationChannel();

        await BackgroundTask.registerTaskAsync(TASK_NAME, {
            minimumInterval: 12 * 60 * 60 * 1000, // 12 hours in milliseconds
        });

        console.log('Background task registered successfully');
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
        console.log('Background task unregistered successfully');
    } catch (error) {
        console.error('Failed to unregister background task:', error);
    }
}

// Helper function to create test expiring items for testing
export async function createTestExpiringItems() {
    try {
        const { auth } = await import('./firebase');
        if (!auth.currentUser) {
            console.log('⚠️  No user authenticated - cannot create test items');
            return;
        }

        const { familyService } = await import('./FamilyService');
        const familyId = await familyService.getCurrentFamilyId();

        console.log('🧪 Creating test expiring items...');

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

        console.log('✅ Created 3 test expiring items');
    } catch (error) {
        console.error('❌ Error creating test items:', error);
    }
}

/**
 * Test function to manually trigger the background task logic
 */
export async function testBackgroundTask() {
    try {
        console.log('Testing background task logic...');

        // Check if user is authenticated
        const { auth } = await import('./firebase');
        if (!auth.currentUser) {
            console.log('⚠️  No user authenticated - notifications require authentication');
            return;
        }

        console.log('✅ User authenticated, checking for expiring items...');

        let expiringItems = await inventoryService.getExpiringSoonItems(3);

        if (expiringItems.length > 0) {
            console.log(`📦 Found ${expiringItems.length} expiring items`);

            const hasPermissions = await requestNotificationPermissions();
            if (!hasPermissions) {
                console.log('❌ No notification permissions for test');
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

            console.log('✅ Test notification scheduled for 2 seconds');
        } else {
            console.log('📦 No expiring items found - creating test items first...');

            // Create test items first
            await createTestExpiringItems();

            // Wait a moment then check again
            await new Promise(resolve => setTimeout(resolve, 1000));
            expiringItems = await inventoryService.getExpiringSoonItems(3);

            if (expiringItems.length > 0) {
                console.log(`📦 Found ${expiringItems.length} test expiring items`);

                const hasPermissions = await requestNotificationPermissions();
                if (!hasPermissions) {
                    console.log('❌ No notification permissions for test');
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

                console.log('✅ Test notification scheduled for 2 seconds with test items');
            } else {
                console.log('📦 Still no expiring items - creating basic test notification anyway');

                // Create a basic test notification
                const hasPermissions = await requestNotificationPermissions();
                if (!hasPermissions) {
                    console.log('❌ No notification permissions for test');
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

                console.log('✅ Basic test notification scheduled for 2 seconds');
            }
        }
    } catch (error) {
        console.error('❌ Test background task failed:', error);
    }
} 