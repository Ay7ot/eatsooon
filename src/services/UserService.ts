import { db } from './firebase';
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    writeBatch,
    where,
} from 'firebase/firestore';
import { familyService } from './FamilyService';

class UserService {
    private static _instance: UserService;

    static get instance() {
        if (!this._instance) {
            this._instance = new UserService();
        }
        return this._instance;
    }

    async deleteUserAccount(userId: string): Promise<void> {
        if (!userId) {
            throw new Error('User ID is required to delete an account.');
        }

        const batch = writeBatch(db);

        // 1. Delete user's inventory
        const inventoryRef = collection(db, 'inventory', userId, 'items');
        const inventorySnapshot = await getDocs(inventoryRef);
        inventorySnapshot.forEach((doc) => batch.delete(doc.ref));

        // 2. Delete user's activities
        const activitiesRef = collection(db, 'users', userId, 'activities');
        const activitiesSnapshot = await getDocs(activitiesRef);
        activitiesSnapshot.forEach((doc) => batch.delete(doc.ref));

        // 3. Delete user's alerts
        const alertsRef = collection(db, 'users', userId, 'alerts');
        const alertsSnapshot = await getDocs(alertsRef);
        alertsSnapshot.forEach((doc) => batch.delete(doc.ref));

        // 4. Handle family memberships
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const familyIds = userData.familyIds || [];

            for (const familyId of familyIds) {
                const familyDoc = await getDoc(doc(db, 'families', familyId));
                if (familyDoc.exists()) {
                    const familyData = familyDoc.data();
                    if (familyData.adminUserId === userId) {
                        // If user is admin, delete the entire family
                        await familyService.deleteFamily(familyId, userId);
                    } else {
                        // If user is a member, just leave the family
                        await familyService.leaveFamily(familyId, userId);
                    }
                }
            }
        }


        // 5. Delete pending invitations sent by the user
        const invitationsRef = collection(db, 'familyInvitations');
        const q = query(invitationsRef, where('inviterUserId', '==', userId));
        const invitationsSnapshot = await getDocs(q);
        invitationsSnapshot.forEach((doc) => batch.delete(doc.ref));


        // 6. Delete the main user document
        batch.delete(userDocRef);

        // Commit all the batched writes
        await batch.commit();
    }
}

export const userService = UserService.instance; 