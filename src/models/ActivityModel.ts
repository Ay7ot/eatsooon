import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export enum ActivityType {
    itemAdded = 'itemAdded',
    itemDeleted = 'itemDeleted',
    itemUpdated = 'itemUpdated',
    recipeViewed = 'recipeViewed',
    recipeFavorited = 'recipeFavorited',
    scanPerformed = 'scanPerformed',
    inventoryCleared = 'inventoryCleared',
}

export interface ActivityModel {
    id: string;
    type: ActivityType;
    title: string;
    subtitle: string;
    imageUrl?: string;
    timestamp: Date;
    metadata: Record<string, any>;
    userId?: string;
    userName?: string;
}

/** Helper to convert Firestore doc -> ActivityModel */
export function activityFromFirestore(doc: QueryDocumentSnapshot<DocumentData>): ActivityModel {
    const data = doc.data();
    return {
        id: doc.id,
        type: (data.type || ActivityType.itemAdded) as ActivityType,
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        imageUrl: data.imageUrl ?? undefined,
        timestamp: (data.timestamp as Timestamp)?.toDate?.() ?? new Date(),
        metadata: data.metadata ?? {},
        userId: data.userId,
        userName: data.userName,
    };
}

/** Helper to convert ActivityModel -> Firestore doc */
export function activityToFirestore(activity: Omit<ActivityModel, 'id'>) {
    return {
        type: activity.type,
        title: activity.title,
        subtitle: activity.subtitle,
        imageUrl: activity.imageUrl ?? null,
        timestamp: activity.timestamp,
        metadata: activity.metadata,
        ...(activity.userId ? { userId: activity.userId } : {}),
        ...(activity.userName ? { userName: activity.userName } : {}),
    };
}

// ----- UI helper getters -----
export function activityIconName(type: ActivityType): string {
    switch (type) {
        case ActivityType.itemAdded:
            return 'inventory_icon';
        case ActivityType.itemDeleted:
            return 'warning_icon';
        case ActivityType.itemUpdated:
            return 'settings_icon';
        case ActivityType.recipeViewed:
        case ActivityType.recipeFavorited:
            return 'book_icon';
        case ActivityType.scanPerformed:
            return 'camera_icon';
        case ActivityType.inventoryCleared:
            return 'inventory_icon';
        default:
            return 'inventory_icon';
    }
}

export function activityColorValue(type: ActivityType): string {
    switch (type) {
        case ActivityType.itemAdded:
            return '#10B981'; // Green
        case ActivityType.itemDeleted:
            return '#EF4444'; // Red
        case ActivityType.itemUpdated:
            return '#3B82F6'; // Blue
        case ActivityType.recipeViewed:
            return '#8B5CF6'; // Purple
        case ActivityType.recipeFavorited:
            return '#F59E0B'; // Orange
        case ActivityType.scanPerformed:
            return '#10B981'; // Green
        case ActivityType.inventoryCleared:
            return '#6B7280'; // Gray
        default:
            return '#6B7280';
    }
}

/** Returns relative time string e.g., 2h ago */
export function activityTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
} 