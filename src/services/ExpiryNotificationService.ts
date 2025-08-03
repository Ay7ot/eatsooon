import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '../localization/i18n';
import { FoodItem } from '../models/FoodItem';
import { inventoryService } from './InventoryService';

const LAST_CHECK_KEY = 'last_expiry_check';
const NOTIFICATION_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const DELIVERED_NOTIFICATIONS_KEY = 'delivered_notifications';

interface ExpiryNotification {
    itemId: string;
    itemName: string;
    daysUntilExpiry: number;
    notificationId: string;
}

class ExpiryNotificationService {
    private static _instance: ExpiryNotificationService;

    static get instance() {
        if (!this._instance) {
            this._instance = new ExpiryNotificationService();
        }
        return this._instance;
    }

    private constructor() { }

    /**
     * Get delivered notifications from storage
     */
    private async getDeliveredNotifications(): Promise<Set<string>> {
        try {
            const delivered = await AsyncStorage.getItem(DELIVERED_NOTIFICATIONS_KEY);
            return delivered ? new Set(JSON.parse(delivered)) : new Set();
        } catch (error) {
            console.warn('Failed to get delivered notifications:', error);
            return new Set();
        }
    }

    /**
     * Mark notification as delivered
     */
    private async markNotificationAsDelivered(notificationId: string): Promise<void> {
        try {
            const delivered = await this.getDeliveredNotifications();
            delivered.add(notificationId);
            await AsyncStorage.setItem(DELIVERED_NOTIFICATIONS_KEY, JSON.stringify([...delivered]));
        } catch (error) {
            console.warn('Failed to mark notification as delivered:', error);
        }
    }

    /**
     * Check if notification has been delivered
     */
    private async isNotificationDelivered(notificationId: string): Promise<boolean> {
        const delivered = await this.getDeliveredNotifications();
        return delivered.has(notificationId);
    }

    /**
     * Clean up old delivered notifications (older than 30 days)
     */
    private async cleanupOldDeliveredNotifications(): Promise<void> {
        try {
            const delivered = await this.getDeliveredNotifications();
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            const cleaned = new Set([...delivered].filter(id => {
                // For the new ID format (expiry-itemId-days), we'll keep all for now
                // since we don't have timestamps in the ID anymore
                // In the future, we could add a separate timestamp field if needed
                return true; // Keep all delivered notifications for now
            }));
            await AsyncStorage.setItem(DELIVERED_NOTIFICATIONS_KEY, JSON.stringify([...cleaned]));
        } catch (error) {
            console.warn('Failed to cleanup old delivered notifications:', error);
        }
    }

    /**
     * Schedule notifications for a newly added item
     * This ensures notifications are scheduled for the full expiry period
     */
    async scheduleNotificationsForNewItem(item: FoodItem): Promise<void> {
        try {
            console.log(`📅 [ExpiryNotificationService] Scheduling notifications for new item: "${item.name}"`);

            const expDate = new Date(item.expirationDate);
            const expDateStart = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const daysUntilExpiry = Math.ceil((expDateStart.getTime() - today.getTime()) / (1000 * 3600 * 24));

            // Schedule notifications for the full 3-day period
            await this.scheduleNotificationsForItem(item, daysUntilExpiry);

        } catch (error) {
            console.error(`❌ [ExpiryNotificationService] Failed to schedule notifications for new item ${item.name}:`, error);
        }
    }

    /**
     * Check for expiring items and schedule notifications
     */
    async checkAndScheduleNotifications(): Promise<void> {
        try {
            console.log('🔍 [ExpiryNotificationService] Checking for expiring items...');

            // Clean up old delivered notifications
            await this.cleanupOldDeliveredNotifications();

            // Get all items from inventory
            const allItems = await inventoryService.getAllItems();
            console.log(`📦 [ExpiryNotificationService] Found ${allItems.length} total items in inventory`);

            if (allItems.length === 0) {
                console.log('✅ [ExpiryNotificationService] No items found in inventory');
                return;
            }

            // Clear existing notifications
            await this.clearExistingNotifications();

            // Find items expiring soon
            const expiringItems = this.getExpiringItems(allItems);

            if (expiringItems.length === 0) {
                console.log('✅ [ExpiryNotificationService] No items expiring soon');
                return;
            }

            console.log(`📅 [ExpiryNotificationService] Found ${expiringItems.length} items expiring soon`);
            expiringItems.forEach(item => {
                const days = this.getDaysUntilExpiry(item);
                console.log(`  - ${item.name}: expires in ${days} days`);
            });

            // Schedule notifications with iOS limit awareness
            await this.scheduleNotificationsWithLimits(expiringItems);

        } catch (error) {
            console.error('❌ [ExpiryNotificationService] Error checking notifications:', error);
        }
    }

    /**
     * Update notifications for an item that has been modified
     * This clears old notifications and schedules new ones based on updated expiry date
     * Note: We do NOT clear delivered notifications here - only when items are deleted
     */
    async updateNotificationsForItem(item: FoodItem): Promise<void> {
        try {
            console.log(`📅 [ExpiryNotificationService] Updating notifications for item: "${item.name}"`);

            // Clear existing scheduled notifications for this item (but keep delivered notifications)
            await this.clearNotificationsForItem(item.id);

            // Schedule new notifications based on updated expiry date
            await this.scheduleNotificationsForNewItem(item);

        } catch (error) {
            console.error(`❌ [ExpiryNotificationService] Failed to update notifications for item ${item.name}:`, error);
        }
    }

    /**
     * Clear notifications for a specific item
     */
    private async clearNotificationsForItem(itemId: string): Promise<void> {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

            for (const notification of scheduledNotifications) {
                if (notification.content.data?.itemId === itemId &&
                    notification.content.data?.type === 'expiry-alert') {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                    console.log(`🗑️ [ExpiryNotificationService] Cleared notification for item ${itemId}`);
                }
            }
        } catch (error) {
            console.error(`❌ [ExpiryNotificationService] Error clearing notifications for item ${itemId}:`, error);
        }
    }

    /**
     * Remove notifications for a deleted item
     */
    async removeNotificationsForItem(itemId: string): Promise<void> {
        try {
            console.log(`🗑️ [ExpiryNotificationService] Removing notifications for deleted item: ${itemId}`);
            await this.clearNotificationsForItem(itemId);

            // Also clear delivered notifications for this item
            await this.clearDeliveredNotificationsForItem(itemId);
        } catch (error) {
            console.error(`❌ [ExpiryNotificationService] Failed to remove notifications for item ${itemId}:`, error);
        }
    }

    /**
     * Clear delivered notifications for a specific item
     * Only called when items are deleted, not when updated
     */
    private async clearDeliveredNotificationsForItem(itemId: string): Promise<void> {
        try {
            const delivered = await this.getDeliveredNotifications();
            const itemPrefix = `expiry-${itemId}-`;
            const cleaned = new Set([...delivered].filter(id => !id.startsWith(itemPrefix)));
            await AsyncStorage.setItem(DELIVERED_NOTIFICATIONS_KEY, JSON.stringify([...cleaned]));
            console.log(`🗑️ [ExpiryNotificationService] Cleared delivered notifications for item ${itemId} (item deleted)`);
        } catch (error) {
            console.warn(`Failed to clear delivered notifications for item ${itemId}:`, error);
        }
    }

    /**
     * Get items that are expiring soon (today, tomorrow, or in 3 days)
     */
    private getExpiringItems(items: FoodItem[]): FoodItem[] {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return items.filter(item => {
            const expDate = new Date(item.expirationDate);
            const expDateStart = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
            const diffDays = Math.ceil((expDateStart.getTime() - today.getTime()) / (1000 * 3600 * 24));

            // Notify for items expiring in 3 days, 1 day, or today
            return diffDays <= 3 && diffDays >= 0;
        });
    }

    /**
     * Schedule a notification for a specific item
     */
    private async scheduleNotificationForItem(item: FoodItem): Promise<void> {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const expDate = new Date(item.expirationDate);
            const expDateStart = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
            const diffDays = Math.ceil((expDateStart.getTime() - today.getTime()) / (1000 * 3600 * 24));

            // Schedule notifications for the full 3-day period
            await this.scheduleNotificationsForItem(item, diffDays);

            console.log(`📅 [ExpiryNotificationService] Scheduled notifications for "${item.name}" (${diffDays} days)`);

        } catch (error) {
            console.error(`❌ [ExpiryNotificationService] Failed to schedule notification for ${item.name}:`, error);
        }
    }

    /**
     * Schedule all relevant notifications for an item
     */
    private async scheduleNotificationsForItem(item: FoodItem, currentDaysUntilExpiry: number): Promise<void> {
        const expDate = new Date(item.expirationDate);
        const expDateStart = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());

        // Define the notifications we want to schedule
        const notificationDays = [3, 1, 0];

        for (const days of notificationDays) {
            // Only schedule notifications that are relevant based on the current expiry date.
            // This prevents scheduling a "3-day" notification for an item that expires tomorrow.
            if (currentDaysUntilExpiry >= days) {
                await this.scheduleSingleNotification(item, days, expDateStart);
            }
        }
    }

    /**
     * Schedule a single notification for a specific day
     */
    private async scheduleSingleNotification(item: FoodItem, daysUntilExpiry: number, expDateStart: Date): Promise<void> {
        try {
            const now = new Date();
            let secondsFromNow: number;

            // 1. Calculate the target notification time (9 AM on the notification day)
            const notificationTime = new Date(expDateStart);
            notificationTime.setDate(notificationTime.getDate() - daysUntilExpiry);
            notificationTime.setHours(9, 0, 0, 0);

            console.log(`[ExpiryNotificationService] Processing ${daysUntilExpiry}-day notification for "${item.name}". Expiry: ${expDateStart.toDateString()}, Scheduled Time: ${notificationTime.toLocaleString()}`);

            // 2. Check if the calculated time is in the past
            if (notificationTime <= now) {
                // The time is in the past. Check if the DAY is also in the past.
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const notificationDay = new Date(notificationTime.getFullYear(), notificationTime.getMonth(), notificationTime.getDate());

                if (notificationDay.getTime() < today.getTime()) {
                    // The notification's target day was before today. It's truly in the past, so skip it.
                    console.log(`⏭️ [ExpiryNotificationService] Skipping notification for "${item.name}" (${daysUntilExpiry} days) - notification day is in the past.`);
                    return;
                } else {
                    // The notification's target day is today, but the time (9 AM) has passed.
                    // This is the key case: we should send this notification immediately.
                    console.log(`[ExpiryNotificationService] Notification time for "${item.name}" (${daysUntilExpiry} days) has passed today. Scheduling for immediate delivery.`);
                    secondsFromNow = 5; // 5 seconds from now
                }
            } else {
                // 3. The time is in the future. Schedule it normally.
                secondsFromNow = (notificationTime.getTime() - now.getTime()) / 1000;
            }

            // Ensure secondsFromNow is at least 1, as required by the API
            secondsFromNow = Math.max(1, secondsFromNow);

            // 4. Check if this notification is already scheduled or delivered to prevent duplicates
            // Use a stable ID format that doesn't include timestamp to enable proper delivered tracking
            const notificationId = `expiry-${item.id}-${daysUntilExpiry}`;
            const existingNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const alreadyScheduled = existingNotifications.some(n => n.identifier === notificationId);

            if (alreadyScheduled) {
                console.log(`🔄 [ExpiryNotificationService] Notification for "${item.name}" (${daysUntilExpiry} days) already scheduled. Skipping duplicate.`);
                return;
            }

            // Check if this notification has already been delivered
            const isDelivered = await this.isNotificationDelivered(notificationId);
            if (isDelivered) {
                console.log(`✅ [ExpiryNotificationService] Notification for "${item.name}" (${daysUntilExpiry} days) already delivered. Skipping.`);
                return;
            }

            const notificationConfig = this.createNotificationConfig(item, daysUntilExpiry);

            console.log(`📝 [ExpiryNotificationService] Final scheduling for "${item.name}" (${daysUntilExpiry} days): "${notificationConfig.title}". Will fire in ~${Math.round(secondsFromNow / 60)} minutes.`);

            // Choose trigger: timeInterval for <=60 s, calendar date otherwise
            const trigger: Notifications.NotificationTriggerInput = secondsFromNow <= 60
                ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(secondsFromNow) } as Notifications.TimeIntervalTriggerInput
                : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notificationTime } as Notifications.DateTriggerInput;

            await Notifications.scheduleNotificationAsync({
                identifier: notificationId,
                content: {
                    title: notificationConfig.title,
                    body: notificationConfig.body,
                    data: {
                        itemId: item.id,
                        itemName: item.name,
                        daysUntilExpiry: daysUntilExpiry,
                        type: 'expiry-alert'
                    },
                    categoryIdentifier: 'expiry-alert',
                    ...(Platform.OS === 'android' && {
                        channelId: 'expiry-alerts'
                    })
                },
                trigger
            });

            console.log(`✅ [ExpiryNotificationService] Successfully scheduled ${daysUntilExpiry}-day notification for "${item.name}"`);

        } catch (error) {
            console.error(`❌ [ExpiryNotificationService] Failed to schedule ${daysUntilExpiry}-day notification for ${item.name}:`, error);
        }
    }

    /**
     * Create notification configuration based on expiry days
     */
    private createNotificationConfig(item: FoodItem, diffDays: number) {
        let title = '';
        let body = '';

        if (diffDays === 0) {
            title = i18n.t('notification_expires_today_title');
            body = i18n.t('notification_expires_today_body', { itemName: item.name });
        } else if (diffDays === 1) {
            title = i18n.t('notification_expires_tomorrow_title');
            body = i18n.t('notification_expires_tomorrow_body', { itemName: item.name });
        } else if (diffDays === 3) {
            title = i18n.t('notification_expires_soon_title');
            body = i18n.t('notification_expires_soon_body', { itemName: item.name });
        }

        return { title, body };
    }

    /**
     * Clear existing expiry notifications
     */
    private async clearExistingNotifications(): Promise<void> {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

            for (const notification of scheduledNotifications) {
                if (notification.content.data?.type === 'expiry-alert') {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                }
            }
        } catch (error) {
            console.error('❌ [ExpiryNotificationService] Error clearing notifications:', error);
        }
    }

    /**
     * Set up notification channels for Android
     */
    async setupNotificationChannels(): Promise<void> {
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
    }

    /**
     * Get summary of scheduled notifications
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
            console.error('❌ [ExpiryNotificationService] Error getting notifications summary:', error);
            return { count: 0, details: [] };
        }
    }

    /**
     * Check iOS notification limits and handle overflow
     */
    private async checkNotificationLimits(): Promise<{ canSchedule: boolean; currentCount: number }> {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const currentCount = scheduledNotifications.length;
            const maxLimit = 60; // Leave buffer below iOS 64 limit

            console.log(`📊 [ExpiryNotificationService] Current notifications: ${currentCount}/${maxLimit}`);

            return {
                canSchedule: currentCount < maxLimit,
                currentCount
            };
        } catch (error) {
            console.error('❌ [ExpiryNotificationService] Error checking notification limits:', error);
            return { canSchedule: true, currentCount: 0 }; // Default to allow if check fails
        }
    }

    /**
     * Prioritize notifications based on urgency
     */
    private getNotificationPriority(item: FoodItem, daysUntilExpiry: number): number {
        // Higher priority = lower number (0 = highest priority)
        if (daysUntilExpiry === 0) return 0; // Today - highest priority
        if (daysUntilExpiry === 1) return 1; // Tomorrow - high priority
        if (daysUntilExpiry === 3) return 2; // Soon - medium priority
        return 3; // Other - lowest priority
    }

    /**
     * Smart scheduling that respects iOS limits with replacement strategy
     */
    private async scheduleNotificationsWithLimits(items: FoodItem[]): Promise<void> {
        const { canSchedule, currentCount } = await this.checkNotificationLimits();

        if (!canSchedule) {
            console.warn(`⚠️ [ExpiryNotificationService] At iOS notification limit (${currentCount}/60). Using smart replacement.`);
            await this.smartReplaceNotifications(items);
            return;
        }

        // Normal scheduling when under limit
        await this.scheduleNotificationsNormally(items);
    }

    /**
     * Normal scheduling when under iOS limits
     */
    private async scheduleNotificationsNormally(items: FoodItem[]): Promise<void> {
        console.log(`📅 [ExpiryNotificationService] Starting normal scheduling for ${items.length} items`);

        let scheduledCount = 0;
        const maxNewNotifications = 60 - (await this.getCurrentNotificationCount());

        for (const item of items) {
            if (scheduledCount >= maxNewNotifications) {
                console.warn(`⚠️ [ExpiryNotificationService] Reached notification limit. Skipping remaining items.`);
                break;
            }

            const daysUntilExpiry = this.getDaysUntilExpiry(item);
            console.log(`📅 [ExpiryNotificationService] Scheduling notifications for "${item.name}" (${daysUntilExpiry} days)`);

            if (daysUntilExpiry <= 3 && daysUntilExpiry >= 0) {
                await this.scheduleNotificationsForItem(item, daysUntilExpiry);
                scheduledCount += 3; // 3 notifications per item
                console.log(`✅ [ExpiryNotificationService] Scheduled 3 notifications for "${item.name}"`);
            } else {
                console.log(`⏭️ [ExpiryNotificationService] Skipping "${item.name}" (${daysUntilExpiry} days - not in range)`);
            }
        }

        console.log(`✅ [ExpiryNotificationService] Normal scheduling completed. Scheduled ${scheduledCount} notifications.`);
    }

    /**
     * Smart replacement when at iOS limits
     */
    private async smartReplaceNotifications(newItems: FoodItem[]): Promise<void> {
        try {
            // Get current notifications
            const currentNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const expiryNotifications = currentNotifications.filter(n => n.content.data?.type === 'expiry-alert');

            // Sort new items by priority (most urgent first)
            const sortedNewItems = newItems.sort((a, b) => {
                const aDays = this.getDaysUntilExpiry(a);
                const bDays = this.getDaysUntilExpiry(b);
                return this.getNotificationPriority(a, aDays) - this.getNotificationPriority(b, bDays);
            });

            let replacedCount = 0;
            const maxReplacements = 10; // Limit replacements to avoid excessive changes

            for (const newItem of sortedNewItems) {
                if (replacedCount >= maxReplacements) break;

                const newItemPriority = this.getNotificationPriority(newItem, this.getDaysUntilExpiry(newItem));

                // Find least urgent existing notification to replace
                const leastUrgentNotification = this.findLeastUrgentNotification(expiryNotifications);

                if (leastUrgentNotification && newItemPriority < leastUrgentNotification.priority) {
                    // Replace less urgent notification with more urgent one
                    await Notifications.cancelScheduledNotificationAsync(leastUrgentNotification.id);
                    await this.scheduleNotificationsForItem(newItem, this.getDaysUntilExpiry(newItem));
                    replacedCount++;

                    console.log(`🔄 [ExpiryNotificationService] Replaced notification for "${leastUrgentNotification.itemName}" with "${newItem.name}"`);
                }
            }

            console.log(`✅ [ExpiryNotificationService] Smart replacement completed. Replaced ${replacedCount} notifications.`);

        } catch (error) {
            console.error('❌ [ExpiryNotificationService] Error in smart replacement:', error);
        }
    }

    /**
     * Find the least urgent notification to replace
     */
    private findLeastUrgentNotification(notifications: any[]): { id: string; itemName: string; priority: number } | null {
        let leastUrgent = null;
        let lowestPriority = -1;

        for (const notification of notifications) {
            const daysUntilExpiry = notification.content.data?.daysUntilExpiry || 999;
            const priority = this.getNotificationPriority({} as FoodItem, daysUntilExpiry);

            if (priority > lowestPriority) {
                lowestPriority = priority;
                leastUrgent = {
                    id: notification.identifier,
                    itemName: notification.content.data?.itemName || 'Unknown',
                    priority: priority
                };
            }
        }

        return leastUrgent;
    }

    /**
     * Get current notification count
     */
    private async getCurrentNotificationCount(): Promise<number> {
        try {
            const notifications = await Notifications.getAllScheduledNotificationsAsync();
            return notifications.length;
        } catch (error) {
            console.error('❌ [ExpiryNotificationService] Error getting notification count:', error);
            return 0;
        }
    }

    /**
     * Get days until expiry for an item
     */
    private getDaysUntilExpiry(item: FoodItem): number {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const expDate = new Date(item.expirationDate);
        const expDateStart = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
        return Math.ceil((expDateStart.getTime() - today.getTime()) / (1000 * 3600 * 24));
    }

    /**
     * Mark a notification as delivered (call this when notification is received)
     */
    async markNotificationAsDeliveredPublic(notificationId: string): Promise<void> {
        await this.markNotificationAsDelivered(notificationId);
        console.log(`📱 [ExpiryNotificationService] Marked notification as delivered: ${notificationId}`);
    }

    /**
     * Get delivered notifications for debugging
     */
    async getDeliveredNotificationsDebug(): Promise<string[]> {
        try {
            const delivered = await this.getDeliveredNotifications();
            return Array.from(delivered);
        } catch (error) {
            console.error('Failed to get delivered notifications for debug:', error);
            return [];
        }
    }

    /**
     * Get notification statistics and limits
     */
    async getNotificationStats(): Promise<{
        currentCount: number;
        maxLimit: number;
        availableSlots: number;
        expiringItems: number;
        priorityBreakdown: { today: number; tomorrow: number; soon: number }
    }> {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
            const currentCount = scheduledNotifications.length;
            const maxLimit = 60;
            const availableSlots = Math.max(0, maxLimit - currentCount);

            // Get expiring items for context
            const allItems = await inventoryService.getAllItems();
            const expiringItems = this.getExpiringItems(allItems);

            // Count by priority
            const priorityBreakdown = {
                today: expiringItems.filter(item => this.getDaysUntilExpiry(item) === 0).length,
                tomorrow: expiringItems.filter(item => this.getDaysUntilExpiry(item) === 1).length,
                soon: expiringItems.filter(item => this.getDaysUntilExpiry(item) === 3).length
            };

            return {
                currentCount,
                maxLimit,
                availableSlots,
                expiringItems: expiringItems.length,
                priorityBreakdown
            };
        } catch (error) {
            console.error('❌ [ExpiryNotificationService] Error getting notification stats:', error);
            return {
                currentCount: 0,
                maxLimit: 60,
                availableSlots: 60,
                expiringItems: 0,
                priorityBreakdown: { today: 0, tomorrow: 0, soon: 0 }
            };
        }
    }
}

export const expiryNotificationService = ExpiryNotificationService.instance;
export default expiryNotificationService; 