import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../../localization/i18n';
import { FoodItem } from '../../models/FoodItem';
import { inventoryService } from '../InventoryService';

const LAST_NOTIFICATION_CHECK_KEY = 'last_notification_check_timestamp';
const FOREGROUND_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

// Configure notification handling for both foreground and background
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true, // For iOS
        shouldShowList: true, // For Android
    }),
});

interface NotificationConfig {
    identifier: string;
    title: string;
    body: string;
    trigger: Date;
    data: any;
}

class NotificationService {
    private static _instance: NotificationService;
    static get instance() {
        if (!this._instance) this._instance = new NotificationService();
        return this._instance;
    }
    private constructor() { }

    async registerForPushNotificationsAsync(): Promise<string | undefined> {
        let token;
        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                return;
            }

            try {
                // Get Expo push token with proper project configuration
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: '694a6a8d-9603-4417-a237-d4ab1400986a'
                })).data;
            } catch (error) {
                console.error('❌ Error getting push token:', error);
            }
        } else {
            console.error('⚠️ Must use physical device for Push Notifications');
        }

        // Configure Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('expiry-alerts', {
                name: 'Food Expiry Alerts',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10B981',
                description: 'Notifications for food items expiring soon',
                sound: 'default',
            });
        }

        return token;
    }

    /**
     * A throttled method to run from the foreground, ensuring we don't over-schedule.
     * This should be called on app startup and after any inventory changes.
     */
    async runForegroundUpdate(): Promise<void> {
        try {
            const lastCheckString = await AsyncStorage.getItem(LAST_NOTIFICATION_CHECK_KEY);
            const now = Date.now();

            if (lastCheckString) {
                const lastCheck = parseInt(lastCheckString, 10);
                if (now - lastCheck < FOREGROUND_CHECK_INTERVAL) {
                    console.log(`[NotificationService] Skipping foreground update, last run was recent.`);
                    return;
                }
            }

            console.log('[NotificationService] Running foreground update to schedule notifications.');
            await this.scheduleInventoryNotifications();
            await AsyncStorage.setItem(LAST_NOTIFICATION_CHECK_KEY, now.toString());

        } catch (e) {
            console.error('Failed to run foreground notification update', e);
        }
    }

    /**
     * Main method called by background task to check and schedule notifications
     * This is optimized for background execution
     */
    async scheduleInventoryNotifications(): Promise<void> {
        try {
            // 1. Get expiring items efficiently (this method already checks auth)
            const items = await inventoryService.getExpiringSoonItems(3);
            if (!items || items.length === 0) {
                console.log('✅ [NotificationService] No expiring items found that require notification. Task finished.');
                return;
            }

            console.log(`[NotificationService] Found ${items.length} expiring items to process.`);

            // 2. Clear old notifications to prevent duplicates
            await this.clearInventoryNotifications();

            // 3. Process items and create notification configurations
            const notificationConfigs = this.createNotificationConfigs(items);
            console.log(`[NotificationService] Created ${notificationConfigs.length} notification configurations.`);

            // 4. Schedule the notifications
            const scheduledCount = await this.scheduleNotificationConfigs(notificationConfigs);
            console.log(`[NotificationService] Successfully scheduled ${scheduledCount} notifications.`);

        } catch (error) {
            console.error('❌ Error scheduling inventory notifications:', error);
            throw error; // Re-throw for background task handling
        }
    }

    /**
     * Create notification configurations for expiring items
     */
    private createNotificationConfigs(items: FoodItem[]): NotificationConfig[] {
        const configs: NotificationConfig[] = [];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        for (const item of items) {
            const expDate = new Date(item.expirationDate);
            const expDateStart = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
            const diffDays = Math.ceil((expDateStart.getTime() - today.getTime()) / (1000 * 3600 * 24));

            // Only notify for items expiring in 3 days, 1 day, or today
            if (diffDays === 3 || diffDays === 1 || diffDays === 0) {
                const config = this.createNotificationConfig(item, diffDays, now);
                if (config) {
                    configs.push(config);
                }
            }
        }

        return configs;
    }

    /**
     * Create a notification configuration for a specific item
     */
    private createNotificationConfig(item: FoodItem, diffDays: number, now: Date): NotificationConfig | null {
        let title = '';
        let body = '';
        let priority = 'normal';

        if (diffDays === 0) {
            title = i18n.t('notification_expires_today_title');
            body = i18n.t('notification_expires_today_body', { itemName: item.name });
            priority = 'high';
        } else if (diffDays === 1) {
            title = i18n.t('notification_expires_tomorrow_title');
            body = i18n.t('notification_expires_tomorrow_body', { itemName: item.name });
            priority = 'high';
        } else if (diffDays === 3) {
            title = i18n.t('notification_expires_soon_title');
            body = i18n.t('notification_expires_soon_body', { itemName: item.name });
            priority = 'normal';
        }

        // Calculate trigger time (9 AM on the notification day)
        const trigger = new Date(now);
        if (diffDays === 0) {
            // For today's expiry, notify immediately if it's past 9 AM, otherwise at 9 AM
            if (now.getHours() >= 9) {
                trigger.setTime(now.getTime() + 60000); // 1 minute from now
            } else {
                trigger.setHours(9, 0, 0, 0);
            }
        } else {
            // For future expiry, notify 1 day before at 9 AM
            trigger.setDate(now.getDate() + (diffDays - 1));
            trigger.setHours(9, 0, 0, 0);
        }

        // Only schedule if trigger is in the future
        if (trigger <= now) {
            return null;
        }

        return {
            identifier: `expiry-${item.id}-${diffDays}`,
            title,
            body,
            trigger,
            data: {
                itemId: item.id,
                itemName: item.name,
                daysUntilExpiry: diffDays,
                priority,
                type: 'expiry-alert'
            }
        };
    }

    /**
     * Schedule notification configurations
     */
    private async scheduleNotificationConfigs(configs: NotificationConfig[]): Promise<number> {
        let scheduledCount = 0;
        if (configs.length === 0) return 0;

        for (const config of configs) {
            try {
                // Calculate trigger time in seconds from now. Must be > 0.
                const secondsFromNow = Math.max(1, (config.trigger.getTime() - Date.now()) / 1000);

                const minutesFromNow = Math.ceil(secondsFromNow / 60);
                console.log(`[NotificationService] Scheduling "${config.title}" for item "${config.data.itemName}" to show in ~${minutesFromNow} minute(s).`);

                await Notifications.scheduleNotificationAsync({
                    identifier: config.identifier,
                    content: {
                        title: config.title,
                        body: config.body,
                        data: config.data,
                        categoryIdentifier: 'expiry-alert',
                        // Use custom channel for Android
                        ...(Platform.OS === 'android' && {
                            channelId: 'expiry-alerts'
                        })
                    },
                    trigger: {
                        seconds: secondsFromNow,
                    } as Notifications.TimeIntervalTriggerInput
                });

                scheduledCount++;

            } catch (error) {
                console.error(`❌ Failed to schedule notification for ${config.data.itemName}:`, error);
            }
        }

        return scheduledCount;
    }

    /**
     * Clear existing inventory-related notifications
     */
    private async clearInventoryNotifications(): Promise<void> {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

            for (const notification of scheduledNotifications) {
                if (notification.content.data?.type === 'expiry-alert') {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                }
            }

        } catch (error) {
            console.error('❌ Error clearing notifications:', error);
        }
    }

    /**
     * Get summary of scheduled notifications (for debugging)
     */
    async getScheduledNotificationsSummary(): Promise<{ count: number; details: any[] }> {
        try {
            const notifications = await Notifications.getAllScheduledNotificationsAsync();
            const expiryNotifications = notifications.filter(n => n.content.data?.type === 'expiry-alert');

            return {
                count: expiryNotifications.length,
                details: expiryNotifications.map(n => ({
                    id: n.identifier,
                    title: n.content.title,
                    item: n.content.data?.itemName,
                    days: n.content.data?.daysUntilExpiry,
                    trigger: new Date(Date.now() + (n.trigger as any).seconds * 1000)
                }))
            };
        } catch (error) {
            console.error('❌ Error getting notifications summary:', error);
            return { count: 0, details: [] };
        }
    }

    /**
     * Handle notification received (when app is running)
     */
    async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
        const { data } = notification.request.content;

        if (data?.type === 'expiry-alert') {
            // You can add custom handling here (e.g., navigate to inventory)
        }
    }

    /**
     * Handle notification response (when user taps notification)
     */
    async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
        const { data } = response.notification.request.content;

        if (data?.type === 'expiry-alert') {
            console.log(`👆 User tapped expiry notification for: ${data.itemName}`);
            // You can add navigation logic here
            // Example: router.push('/inventory')
        }
    }
}

export const notificationService = NotificationService.instance;

// Export default instance for convenience
export default notificationService; 