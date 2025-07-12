import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export interface FoodItem {
    id: string;
    name: string;
    expirationDate: Date;
    category: string;
    quantity: number;
    unit: string;
    imageUrl?: string;
}

// Helper: days until expiration (negative if expired)
export function daysUntilExpiration(item: FoodItem): number {
    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const expOnly = new Date(item.expirationDate.getFullYear(), item.expirationDate.getMonth(), item.expirationDate.getDate());
    return Math.floor((expOnly.getTime() - dateOnly.getTime()) / 86400000);
}

// Helper: status color based on days until expiration (matches Flutter mapping)
export function statusColor(item: FoodItem): string {
    const d = daysUntilExpiration(item);
    if (d < 0) return '#EF4444'; // expired (red)
    if (d === 0) return '#EF4444'; // today
    if (d <= 3) return '#F59E0B'; // soon (amber)
    return '#10B981'; // fresh (green)
}

export function foodItemFromFirestore(doc: QueryDocumentSnapshot<DocumentData>): FoodItem {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name ?? 'Item',
        expirationDate: (data.expirationDate as Timestamp).toDate(),
        category: data.category ?? 'General',
        quantity: data.quantity ?? 1,
        unit: data.unit ?? '',
        imageUrl: data.imageUrl ?? undefined,
    };
} 