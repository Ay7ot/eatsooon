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
            title: 'act_item_added_title',
            subtitle: 'act_item_added_sub',
            imageUrl,
            metadata: { itemName },
        });
    }

    async logItemUpdated(itemName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.itemUpdated,
            title: 'act_item_updated_title',
            subtitle: 'act_item_updated_sub',
            imageUrl,
            metadata: { itemName },
        });
    }

    async logItemDeleted(itemName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.itemDeleted,
            title: 'act_item_deleted_title',
            subtitle: 'act_item_deleted_sub',
            imageUrl,
            metadata: { itemName },
        });
    }

    async logRecipeViewed(recipeName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.recipeViewed,
            title: 'act_recipe_viewed_title',
            subtitle: 'act_recipe_viewed_sub',
            imageUrl,
            metadata: { recipeName },
        });
    }

    async logRecipeFavorited(recipeName: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.recipeFavorited,
            title: 'act_recipe_favorited_title',
            subtitle: 'act_recipe_favorited_sub',
            imageUrl,
            metadata: { recipeName },
        });
    }

    async logScanPerformed(detectedItem?: string, imageUrl?: string) {
        await this.logActivity({
            type: ActivityType.scanPerformed,
            title: 'act_scan_performed_title',
            subtitle: 'act_scan_performed_sub',
            imageUrl,
            metadata: detectedItem ? { detectedItem } : {},
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