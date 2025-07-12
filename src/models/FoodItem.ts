import { DocumentData, QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

export interface FoodItem {
    id: string;
    name: string;
    expirationDate: Date;
    imageUrl?: string;
}

export function foodItemFromFirestore(doc: QueryDocumentSnapshot<DocumentData>): FoodItem {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name ?? 'Item',
        expirationDate: (data.expirationDate as Timestamp).toDate(),
        imageUrl: data.imageUrl ?? undefined,
    };
} 