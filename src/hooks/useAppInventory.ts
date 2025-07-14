import { useEffect, useMemo, useState } from 'react';
import { FoodItem } from '../models/FoodItem';
import { useAuth } from '../services/AuthContext';
import { familyService } from '../services/FamilyService';
import { inventoryService } from '../services/InventoryService';

type InventoryScope = 'user' | 'family';

interface InventoryStats {
    total: number;
    expiringSoon: number;
    expiringToday: number;
    expired: number;
}

const calculateStatistics = (items: FoodItem[]): InventoryStats => {
    if (!items) return { total: 0, expiringSoon: 0, expiringToday: 0, expired: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expiringSoon = 0;
    let expiringToday = 0;
    let expired = 0;

    for (const item of items) {
        const expDate = new Date(item.expirationDate);
        expDate.setHours(0, 0, 0, 0);

        const diffDays = (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24);

        if (diffDays < 0) {
            expired++;
        } else if (diffDays === 0) {
            expiringToday++;
        } else if (diffDays <= 3) {
            expiringSoon++;
        }
    }

    return {
        total: items.length,
        expiringSoon,
        expiringToday,
        expired,
    };
};


export const useAppInventory = (scope: InventoryScope) => {
    const { user } = useAuth();
    const [items, setItems] = useState<FoodItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);

    // Listen to the current family ID to react to changes
    useEffect(() => {
        if (!user) {
            setCurrentFamilyId(null);
            return;
        }
        const unsub = familyService.listenToCurrentFamilyId(setCurrentFamilyId);
        return () => unsub();
    }, [user]);


    // This effect handles the core listening logic
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            setItems([]);
            return;
        }

        setIsLoading(true);
        let unsub: () => void = () => { };

        if (scope === 'family') {
            if (currentFamilyId) {
                // Scope is 'family' and a family is selected
                unsub = inventoryService.listenFoodItems(
                    (items) => {
                        setItems(items);
                        setIsLoading(false);
                    },
                    { familyId: currentFamilyId }
                );
            } else {
                // Scope is 'family' but NO family is selected, show empty
                setItems([]);
                setIsLoading(false);
            }
        } else {
            // Scope is 'user', listen to personal inventory
            unsub = inventoryService.listenFoodItems(
                (items) => {
                    setItems(items);
                    setIsLoading(false);
                },
                { familyId: null } // `null` explicitly targets the personal inventory
            );
        }

        return () => unsub();
    }, [user, scope, currentFamilyId]);

    const stats = useMemo(() => calculateStatistics(items), [items]);

    return { items, stats, isLoading };
}; 