import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { expiryNotificationService } from './ExpiryNotificationService';

const TASK_NAME = 'check-expiring-items-task';

// Per the Expo docs, this must be defined in the global scope.
TaskManager.defineTask(TASK_NAME, async () => {
    try {
        console.log('Background task started: Checking for expiring items...');
        await expiryNotificationService.checkAndScheduleNotifications();
        console.log('Background task finished successfully.');
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
            console.log('Background task is already registered.');
            return;
        }

        // Set up notification channels
        await expiryNotificationService.setupNotificationChannels();

        // TODO: The `stopOnTerminate` and `startOnBoot` options were removed to resolve a linting error.
        // These are valid options for iOS and Android respectively and should be re-enabled
        // after updating Expo and its type definitions.
        await BackgroundTask.registerTaskAsync(TASK_NAME, {
            minimumInterval: 60 * 15, // Runs every 15 minutes (for testing, can be increased later)
        });
        console.log('Background task registered successfully.');

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
        console.log('Background task unregistered successfully.');
    } catch (error) {
        console.error('Failed to unregister background task:', error);
    }
}

/**
 * Test function to manually trigger the background task logic
 */
export async function testBackgroundTask() {
    try {
        console.log('Manually triggering background task for testing...');
        await expiryNotificationService.checkAndScheduleNotifications();
        console.log('Test task finished. Check for scheduled notifications.');
    } catch (error) {
        console.error('❌ Test background task failed:', error);
    }
} 