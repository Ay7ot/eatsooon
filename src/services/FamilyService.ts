/*
  Stub FamilyService replicating basic family member retrieval used by Flutter app.
  This will be expanded later.
*/
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface FamilyMember {
    userId: string;
    displayName: string;
    email: string;
    profileImage?: string;
    role: 'admin' | 'member';
}

class FamilyService {
    private static _instance: FamilyService;
    static get instance() {
        if (!this._instance) this._instance = new FamilyService();
        return this._instance;
    }
    private constructor() { }

    async getCurrentFamilyId(): Promise<string | null> {
        try {
            const user = auth.currentUser;
            if (!user) return null;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const data = userDoc.exists() ? userDoc.data() : undefined;
            return data?.currentFamilyId ?? null;
        } catch (e) {
            console.warn('FamilyService getCurrentFamilyId error', e);
            return null;
        }
    }

    listenFamilyMembers(familyId: string, next: (members: FamilyMember[]) => void) {
        if (!familyId) return () => { };
        const unsub = onSnapshot(doc(db, 'familyMembers', familyId), (snap) => {
            if (!snap.exists()) {
                next([]);
                return;
            }
            const data = snap.data();
            const membersMap = data.members ?? {};
            const members: FamilyMember[] = Object.entries(membersMap).map(([uid, info]: any) => ({
                userId: uid,
                ...info,
            }));
            next(members);
        });
        return unsub;
    }
}

export const familyService = FamilyService.instance; 