import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FoodItem } from '../../models/FoodItem';
import { inventoryService } from '../InventoryService';

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
                console.log('❌ Failed to get push token for push notification!');
                return;
            }

            try {
                // Get Expo push token with proper project configuration
                token = (await Notifications.getExpoPushTokenAsync({
                    projectId: 'eatsooon'
                })).data;
                console.log('✅ Push token registered:', token);
            } catch (error) {
                console.log('❌ Error getting push token:', error);
            }
        } else {
            console.log('⚠️ Must use physical device for Push Notifications');
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
     * Main method called by background task to check and schedule notifications
     * This is optimized for background execution
     */
    async scheduleInventoryNotifications(): Promise<void> {
        try {
            console.log('🔔 Starting inventory notification check...');

            // 1. Get expiring items efficiently (this method already checks auth)
            const items = await inventoryService.getExpiringSoonItems(3);
            if (!items || items.length === 0) {
                console.log('📦 No expiring items found in inventory');
                return;
            }

            // 2. Clear old notifications to prevent duplicates
            await this.clearInventoryNotifications();

            // 3. Process items and create notification configurations
            const notificationConfigs = this.createNotificationConfigs(items);

            // 4. Schedule the notifications
            const scheduledCount = await this.scheduleNotificationConfigs(notificationConfigs);

            console.log(`✅ Scheduled ${scheduledCount} notifications for ${items.length} items`);

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
            title = `🚨 Expiring Today!`;
            body = `${item.name} expires today. Use it now!`;
            priority = 'high';
        } else if (diffDays === 1) {
            title = `⏰ Expires Tomorrow`;
            body = `${item.name} expires in 1 day`;
            priority = 'high';
        } else if (diffDays === 3) {
            title = `📅 Expiring Soon`;
            body = `${item.name} expires in 3 days`;
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

        for (const config of configs) {
            try {
                const secondsFromNow = Math.max(1, (config.trigger.getTime() - Date.now()) / 1000);

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

                console.log(`📅 Scheduled: ${config.title} for ${config.data.itemName} at ${config.trigger.toLocaleString()}`);
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

            console.log('🧹 Cleared existing inventory notifications');
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
            console.log(`🔔 Expiry notification received for: ${data.itemName}`);
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