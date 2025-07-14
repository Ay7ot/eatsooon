import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { FoodItem, foodItemFromFirestore } from '../models/FoodItem';
import { activityService } from './ActivityService';
import { auth, db } from './firebase';

class InventoryService {
    private static _instance: InventoryService;
    static get instance() {
        if (!this._instance) this._instance = new InventoryService();
        return this._instance;
    }
    private constructor() { }

    listenFoodItems(
        next: (items: FoodItem[]) => void,
        options?: { familyId?: string | null }
    ) {
        const user = auth.currentUser;
        if (!user) return () => { };

        const { familyId } = options || {};
        let q;

        if (familyId) {
            // Listen to the shared family pantry
            q = query(
                collection(db, 'families', familyId, 'pantry'),
                orderBy('expirationDate', 'asc'),
            );
        } else {
            // Fallback to user's personal inventory
            q = query(
                collection(db, 'inventory', user.uid, 'items'),
                orderBy('expirationDate', 'asc'),
            );
        }

        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(foodItemFromFirestore);
            next(items);
        },
            (err) => {
                console.warn('Inventory listener error:', err);
                next([]);
            });
        return unsub;
    }


    // Add food item to Firestore
    async addFoodItem(params: {
        name: string;
        expirationDate: Date;
        category: string;
        quantity: number;
        unit: string;
        imageUrl?: string;
        familyId?: string | null;
    }): Promise<string> {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const itemData = {
            name: params.name.trim(),
            expirationDate: params.expirationDate,
            category: params.category,
            quantity: params.quantity,
            unit: params.unit,
            imageUrl: params.imageUrl ?? '',
            createdAt: new Date(),
            addedBy: user.uid, // Track who added the item
        };

        let collectionPath;
        if (params.familyId) {
            collectionPath = collection(db, 'families', params.familyId, 'pantry');
        } else {
            collectionPath = collection(db, 'inventory', user.uid, 'items');
        }

        const docRef = await addDoc(collectionPath, itemData);

        // Log activity
        await activityService.logItemAdded(params.name.trim(), params.imageUrl);
        return docRef.id;
    }

    // Update food item
    async updateFoodItem(params: {
        itemId: string;
        familyId?: string | null;
        name?: string;
        expirationDate?: Date;
        category?: string;
        quantity?: number;
        unit?: string;
        imageUrl?: string;
    }): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        const updateData: any = {};
        if (params.name !== undefined) updateData.name = params.name.trim();
        if (params.expirationDate !== undefined) updateData.expirationDate = params.expirationDate;
        if (params.category !== undefined) updateData.category = params.category;
        if (params.quantity !== undefined) updateData.quantity = params.quantity;
        if (params.unit !== undefined) updateData.unit = params.unit;
        if (params.imageUrl !== undefined) updateData.imageUrl = params.imageUrl;

        let docPath;
        if (params.familyId) {
            docPath = doc(db, 'families', params.familyId, 'pantry', params.itemId);
        } else {
            docPath = doc(db, 'inventory', user.uid, 'items', params.itemId);
        }

        await updateDoc(docPath, updateData);

        // Log activity
        await activityService.logItemUpdated(params.name || 'Item', params.imageUrl);
    }

    // Delete food item
    async deleteFoodItem(itemId: string, familyId?: string | null): Promise<void> {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');

        let docPath;
        if (familyId) {
            docPath = doc(db, 'families', familyId, 'pantry', itemId);
        } else {
            docPath = doc(db, 'inventory', user.uid, 'items', itemId);
        }

        await deleteDoc(docPath);

        // Log activity
        await activityService.logItemDeleted('Item', undefined);
    }
}

export const inventoryService = InventoryService.instance; 