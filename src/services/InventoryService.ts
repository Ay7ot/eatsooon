import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { FoodItem, foodItemFromFirestore } from '../models/FoodItem';
import { activityService } from './ActivityService';
import { familyService } from './FamilyService';
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

        let docPath;
        if (params.familyId) {
            docPath = doc(db, 'families', params.familyId, 'pantry', params.itemId);
        } else {
            docPath = doc(db, 'inventory', user.uid, 'items', params.itemId);
        }

        // Get current item name for activity logging
        let currentItemName = 'Item';
        let currentImageUrl: string | undefined;
        try {
            const docSnap = await getDoc(docPath);
            if (docSnap.exists()) {
                const data = docSnap.data();
                currentItemName = data.name || 'Item';
                currentImageUrl = data.imageUrl;
            }
        } catch (error) {
            console.warn('Error getting current item details:', error);
        }

        const updateData: any = {};
        if (params.name !== undefined) updateData.name = params.name.trim();
        if (params.expirationDate !== undefined) updateData.expirationDate = params.expirationDate;
        if (params.category !== undefined) updateData.category = params.category;
        if (params.quantity !== undefined) updateData.quantity = params.quantity;
        if (params.unit !== undefined) updateData.unit = params.unit;
        if (params.imageUrl !== undefined) updateData.imageUrl = params.imageUrl;

        await updateDoc(docPath, updateData);

        // Log activity with the updated name if provided, otherwise use current name
        const activityName = params.name || currentItemName;
        const activityImageUrl = params.imageUrl || currentImageUrl;
        await activityService.logItemUpdated(activityName, activityImageUrl);
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

        // Get item details before deletion for activity logging
        let itemName = 'Item';
        let imageUrl: string | undefined;
        try {
            const docSnap = await getDoc(docPath);
            if (docSnap.exists()) {
                const data = docSnap.data();
                itemName = data.name || 'Item';
                imageUrl = data.imageUrl;
            }
        } catch (error) {
            console.warn('Error getting item details before deletion:', error);
        }

        await deleteDoc(docPath);

        // Log activity with actual item name
        await activityService.logItemDeleted(itemName, imageUrl);
    }

    async getExpiringSoonItems(days: number = 3): Promise<FoodItem[]> {
        const user = auth.currentUser;
        if (!user) {
            console.log('No user logged in, cannot fetch expiring items.');
            return [];
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() + days + 1);

        const personalQuery = query(
            collection(db, 'inventory', user.uid, 'items'),
            where('expirationDate', '>=', today),
            where('expirationDate', '<', cutoffDate)
        );

        const familyId = await familyService.getCurrentFamilyId();
        const familyQuery = familyId ? query(
            collection(db, 'families', familyId, 'pantry'),
            where('expirationDate', '>=', today),
            where('expirationDate', '<', cutoffDate)
        ) : null;

        try {
            const [personalSnapshot, familySnapshot] = await Promise.all([
                getDocs(personalQuery),
                familyQuery ? getDocs(familyQuery) : Promise.resolve(null),
            ]);

            const personalItems = personalSnapshot.docs.map(foodItemFromFirestore);
            const familyItems = familySnapshot ? familySnapshot.docs.map(foodItemFromFirestore) : [];

            // Combine and remove duplicates by item ID
            const allItems = [...personalItems, ...familyItems];
            const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

            console.log(`Found ${uniqueItems.length} unique expiring items.`);
            return uniqueItems;
        } catch (error) {
            console.error('Error fetching expiring items:', error);
            return [];
        }
    }
}

export const inventoryService = InventoryService.instance; 