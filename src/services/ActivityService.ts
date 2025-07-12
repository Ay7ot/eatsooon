import {
    addDoc,
    collection,
    limit as limitFn,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp
} from 'firebase/firestore';
import {
    ActivityModel,
    ActivityType,
    activityFromFirestore,
    activityToFirestore,
} from '../models/ActivityModel';
import { auth, db } from './firebase';

export class ActivityService {
    static instance: ActivityService;
    static getInstance() {
        if (!this.instance) this.instance = new ActivityService();
        return this.instance;
    }

    private constructor() { }

    /** Log a new activity for current user */
    async logActivity(params: Omit<ActivityModel, 'id' | 'timestamp' | 'userId'>) {
        const user = auth.currentUser;
        if (!user) return;
        const colRef = collection(db, 'users', user.uid, 'activities');
        await addDoc(colRef, {
            ...activityToFirestore({ ...params, timestamp: new Date(), metadata: params.metadata ?? {}, userId: user.uid }),
            timestamp: serverTimestamp(),
        });
    }

    /** Convenience wrappers */
    async logItemAdded(itemName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.itemAdded,
            title: `${itemName} added to pantry`,
            subtitle: 'New item in your inventory',
            imageUrl,
            metadata: { itemName },
        });
    }

    async logItemDeleted(itemName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.itemDeleted,
            title: `${itemName} removed from pantry`,
            subtitle: 'Item deleted from inventory',
            imageUrl,
            metadata: { itemName },
        });
    }

    async logRecipeViewed(recipeName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.recipeViewed,
            title: `Viewed ${recipeName} recipe`,
            subtitle: 'Recipe details opened',
            imageUrl,
            metadata: { recipeName },
        });
    }

    async logRecipeFavorited(recipeName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.recipeFavorited,
            title: `Favorited ${recipeName}`,
            subtitle: 'Recipe added to favorites',
            imageUrl,
            metadata: { recipeName },
        });
    }

    async logScanPerformed(detectedItem?: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.scanPerformed,
            title: 'Product scanned',
            subtitle: detectedItem ? `Detected: ${detectedItem}` : 'Barcode/text recognition performed',
            imageUrl,
            metadata: { detectedItem },
        });
    }

    /** Listen to activities for current user */
    onActivitiesSnapshot({ limit = 10, next }: { limit?: number; next: (activities: ActivityModel[]) => void }) {
        const user = auth.currentUser;
        if (!user) {
            next([]);
            return () => { };
        }

        const q = query(
            collection(db, 'users', user.uid, 'activities'),
            orderBy('timestamp', 'desc'),
            limitFn(limit),
        );

        const unsub = onSnapshot(q, (snap) => {
            const activities = snap.docs.map(activityFromFirestore);
            next(activities);
        }, (err) => {
            console.warn('Activities listener error', err);
            next([]);
        });

        return unsub;
    }
}

export const activityService = ActivityService.getInstance(); 