import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { FoodItem, foodItemFromFirestore } from '../models/FoodItem';
import { auth, db } from './firebase';

class InventoryService {
    private static _instance: InventoryService;
    static get instance() {
        if (!this._instance) this._instance = new InventoryService();
        return this._instance;
    }
    private constructor() { }

    listenFoodItems(next: (items: FoodItem[]) => void) {
        const user = auth.currentUser;
        if (!user) return () => { };

        const q = query(
            collection(db, 'inventory', user.uid, 'items'),
            orderBy('expirationDate', 'asc'),
        );

        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(foodItemFromFirestore);
            next(items);
        },
            (err) => {
                console.warn('Inventory listener error', err);
                next([]);
            });
        return unsub;
    }
}

export const inventoryService = InventoryService.instance; 