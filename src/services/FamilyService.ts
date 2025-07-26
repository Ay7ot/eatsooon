/*
  Complete FamilyService implementation for React Native app.
  Replicates functionality from the Flutter app's FamilyService.
*/
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    increment,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import {
    FamilyInvitation,
    FamilyMember,
    FamilyMemberRole,
    FamilyMemberStatus,
    FamilyModel,
    InvitationStatus,
    familyFromFirestore,
    familyInvitationFromFirestore,
    familyInvitationToFirestore,
    familyMemberFromFirestore,
    familyMemberToFirestore,
    familyToFirestore
} from '../models/FamilyModel';
import { auth, db } from './firebase';

class FamilyService {
    private static _instance: FamilyService;
    static get instance() {
        if (!this._instance) this._instance = new FamilyService();
        return this._instance;
    }
    private constructor() { }

    private get currentUserId(): string | null {
        return auth.currentUser?.uid || null;
    }

    // Create a new family
    async createFamily(familyName: string): Promise<string> {
        try {
            if (!this.currentUserId) {
                throw new Error('No user is currently signed in.');
            }

            const user = auth.currentUser!;
            const now = new Date();

            // Create family document
            const familyData = familyToFirestore({
                name: familyName.trim(),
                adminUserId: this.currentUserId,
                createdAt: now,
                settings: {
                    allowMemberInvites: true,
                    requireApprovalForDeletion: false,
                },
                statistics: {
                    totalItems: 0,
                    wasteReduced: 0,
                    memberCount: 1,
                },
            });

            const familyRef = await addDoc(collection(db, 'families'), familyData);
            const familyId = familyRef.id;

            // Add creator as admin member
            await this.addMemberToFamily({
                familyId,
                userId: this.currentUserId,
                displayName: user.displayName || 'User',
                email: user.email || '',
                role: FamilyMemberRole.ADMIN,
                status: FamilyMemberStatus.ACTIVE,
            });

            // Update user's family association
            await this.updateUserFamilyAssociation(this.currentUserId, familyId, true);

            return familyId;
        } catch (error) {
            console.error('Error creating family:', error);
            throw new Error(`Failed to create family: ${error}`);
        }
    }

    // Get family by ID
    async getFamily(familyId: string): Promise<FamilyModel | null> {
        try {
            const familyDoc = await getDoc(doc(db, 'families', familyId));
            if (familyDoc.exists()) {
                return familyFromFirestore(familyDoc);
            }
            return null;
        } catch (error) {
            console.error('Error getting family:', error);
            throw new Error(`Failed to get family: ${error}`);
        }
    }

    // Get family stream for real-time updates
    listenToFamily(familyId: string, callback: (family: FamilyModel | null) => void): () => void {
        return onSnapshot(doc(db, 'families', familyId), (doc) => {
            if (doc.exists()) {
                callback(familyFromFirestore(doc));
            } else {
                callback(null);
            }
        }, (error) => {
            console.error('Error listening to family:', error);
            callback(null);
        });
    }

    // Get family members
    async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
        try {
            const familyMembersDoc = await getDoc(doc(db, 'familyMembers', familyId));
            if (!familyMembersDoc.exists()) return [];

            const data = familyMembersDoc.data();
            const members = data.members as Record<string, any> || {};

            return Object.entries(members).map(([userId, memberData]) =>
                familyMemberFromFirestore(memberData, userId, familyId)
            );
        } catch (error) {
            console.error('Error getting family members:', error);
            throw new Error(`Failed to get family members: ${error}`);
        }
    }

    // Listen to family members for real-time updates
    listenToFamilyMembers(familyId: string, callback: (members: FamilyMember[]) => void): () => void {
        if (!familyId) return () => { };

        return onSnapshot(doc(db, 'familyMembers', familyId), (doc) => {
            if (!doc.exists()) {
                callback([]);
                return;
            }

            const data = doc.data();
            const members = data.members as Record<string, any> || {};
            const membersList = Object.entries(members).map(([userId, memberData]) =>
                familyMemberFromFirestore(memberData, userId, familyId)
            );
            callback(membersList);
        }, (error) => {
            console.error('Error listening to family members:', error);
            callback([]);
        });
    }

    // Invite member to family
    async inviteMember(familyId: string, email: string): Promise<string> {
        try {
            if (!this.currentUserId) {
                throw new Error('No user is currently signed in.');
            }

            // Check if user is admin of the family
            const members = await this.getFamilyMembers(familyId);
            const currentUserMember = members.find(member => member.userId === this.currentUserId);

            if (!currentUserMember) {
                throw new Error('You are not a member of this family.');
            }

            if (currentUserMember.role !== FamilyMemberRole.ADMIN) {
                throw new Error('Only admins can invite new members.');
            }

            // Check if email is already a member
            const existingMember = members.find(member =>
                member.email.toLowerCase() === email.toLowerCase()
            );
            if (existingMember) {
                throw new Error('This email is already a member of the family.');
            }

            // Get family info
            const family = await this.getFamily(familyId);
            if (!family) {
                throw new Error('Family not found.');
            }

            const user = auth.currentUser!;
            const now = new Date();

            // Create invitation
            const invitationData = familyInvitationToFirestore({
                familyId,
                familyName: family.name,
                inviterUserId: this.currentUserId,
                inviterName: user.displayName || 'User',
                inviteeEmail: email.toLowerCase().trim(),
                status: InvitationStatus.PENDING,
                createdAt: now,
                expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
            });

            const invitationRef = await addDoc(collection(db, 'familyInvitations'), invitationData);

            return invitationRef.id;
        } catch (error) {
            console.error('Error inviting member:', error);
            throw new Error(`Failed to invite member: ${error}`);
        }
    }

    // Accept family invitation
    async acceptInvitation(invitationId: string): Promise<void> {
        try {
            if (!this.currentUserId) {
                throw new Error('No user is currently signed in.');
            }

            const user = auth.currentUser!;

            // Get invitation details
            const invitationDoc = await getDoc(doc(db, 'familyInvitations', invitationId));

            if (!invitationDoc.exists()) {
                throw new Error('Invitation not found or has expired.');
            }

            const invitation = familyInvitationFromFirestore(invitationDoc);

            // Verify invitation is for current user
            if (invitation.inviteeEmail.toLowerCase() !== user.email?.toLowerCase()) {
                throw new Error('This invitation is not for your email address.');
            }

            if (invitation.status !== InvitationStatus.PENDING) {
                throw new Error(`This invitation has already been ${invitation.status}.`);
            }

            // Check if invitation has expired
            if (invitation.expiresAt < new Date()) {
                throw new Error('This invitation has expired.');
            }

            // Add user to family members
            await this.addMemberToFamily({
                familyId: invitation.familyId,
                userId: this.currentUserId,
                displayName: user.displayName || 'User',
                email: user.email || '',
                role: FamilyMemberRole.MEMBER,
                status: FamilyMemberStatus.ACTIVE,
            });

            // Update invitation status
            await updateDoc(doc(db, 'familyInvitations', invitationId), {
                status: InvitationStatus.ACCEPTED,
                respondedAt: serverTimestamp(),
            });

            // Update user's family association
            await this.updateUserFamilyAssociation(this.currentUserId, invitation.familyId, true);

        } catch (error) {
            console.error('Error accepting invitation:', error);
            throw new Error(`Failed to accept invitation: ${error}`);
        }
    }

    // A user can leave a family they are a member of
    async leaveFamily(familyId: string, userId: string): Promise<void> {
        try {
            if (!this.currentUserId || this.currentUserId !== userId) {
                throw new Error('You can only leave a family for yourself.');
            }

            const members = await this.getFamilyMembers(familyId);
            const member = members.find(m => m.userId === userId);

            if (!member) {
                throw new Error('You are not a member of this family.');
            }

            if (member.role === FamilyMemberRole.ADMIN) {
                throw new Error('Admins cannot leave a family. You must delete the family or transfer ownership.');
            }

            const batch = writeBatch(db);

            // Remove member from the familyMembers document
            const familyMembersRef = doc(db, 'familyMembers', familyId);
            batch.update(familyMembersRef, {
                [`members.${userId}`]: deleteField()
            });

            // Decrement member count in the family document
            const familyRef = doc(db, 'families', familyId);
            batch.update(familyRef, {
                'statistics.memberCount': increment(-1),
            });

            // Update the user's document
            const userRef = doc(db, 'users', userId);
            batch.update(userRef, {
                familyIds: arrayRemove(familyId),
                currentFamilyId: deleteField(), // Or switch to another family
            });

            await batch.commit();
        } catch (error) {
            console.error('Error leaving family:', error);
            throw new Error(`Failed to leave family: ${error}`);
        }
    }

    // Remove a member from a family
    async removeMember(familyId: string, userId: string): Promise<void> {
        try {
            if (!this.currentUserId) {
                throw new Error('No user is currently signed in.');
            }

            // Check if current user is an admin
            const members = await this.getFamilyMembers(familyId);
            const currentUserMember = members.find(member => member.userId === this.currentUserId);

            if (!currentUserMember) {
                throw new Error('You are not a member of this family.');
            }

            if (currentUserMember.role !== FamilyMemberRole.ADMIN) {
                throw new Error('Only admins can remove members.');
            }

            if (currentUserMember.userId === userId) {
                throw new Error('Admins cannot remove themselves.');
            }

            const batch = writeBatch(db);

            // Remove member from the familyMembers document
            const familyMembersRef = doc(db, 'familyMembers', familyId);
            batch.update(familyMembersRef, {
                [`members.${userId}`]: deleteField()
            });

            // Decrement member count in the family document
            const familyRef = doc(db, 'families', familyId);
            batch.update(familyRef, {
                'statistics.memberCount': increment(-1),
            });

            // Update the removed user's document
            const userRef = doc(db, 'users', userId);
            batch.update(userRef, {
                familyIds: arrayRemove(familyId),
                currentFamilyId: deleteField(),
            });

            await batch.commit();

        } catch (error) {
            console.error('Error removing member:', error);
            throw new Error(`Failed to remove member: ${error}`);
        }
    }

    // Update member role
    async updateMemberRole(familyId: string, userId: string, newRole: FamilyMemberRole): Promise<void> {
        try {
            if (!this.currentUserId) {
                throw new Error('No user is currently signed in.');
            }

            // Check if current user is admin
            const members = await this.getFamilyMembers(familyId);
            const currentUserMember = members.find(member => member.userId === this.currentUserId);

            if (!currentUserMember) {
                throw new Error('You are not a member of this family.');
            }

            if (currentUserMember.role !== FamilyMemberRole.ADMIN) {
                throw new Error('Only admins can change member roles.');
            }

            // Update member role
            await updateDoc(doc(db, 'familyMembers', familyId), {
                [`members.${userId}.role`]: newRole,
            });

        } catch (error) {
            console.error('Error updating member role:', error);
            throw new Error(`Failed to update member role: ${error}`);
        }
    }

    // Helper method to add member to family
    private async addMemberToFamily({
        familyId,
        userId,
        displayName,
        email,
        role,
        status,
    }: {
        familyId: string;
        userId: string;
        displayName: string;
        email: string;
        role: FamilyMemberRole;
        status: FamilyMemberStatus;
    }): Promise<void> {
        const member: Omit<FamilyMember, 'profileImage'> = {
            userId,
            familyId,
            displayName,
            email,
            role,
            status,
            joinedAt: new Date(),
            lastActiveAt: new Date(),
            itemsAddedThisMonth: 0,
        };

        await setDoc(doc(db, 'familyMembers', familyId), {
            members: {
                [userId]: familyMemberToFirestore(member as FamilyMember)
            }
        }, { merge: true });
    }

    // Helper method to update user's family association
    private async updateUserFamilyAssociation(
        userId: string,
        familyId: string,
        setAsCurrent: boolean = false
    ): Promise<void> {
        const userRef = doc(db, 'users', userId);

        const updateData: any = {
            familyIds: arrayUnion(familyId),
        };

        if (setAsCurrent) {
            updateData.currentFamilyId = familyId;
        }

        await updateDoc(userRef, updateData);
    }

    // Get current family ID for the current user
    async getCurrentFamilyId(): Promise<string | null> {
        try {
            if (!this.currentUserId) return null;

            const userDoc = await getDoc(doc(db, 'users', this.currentUserId));
            const data = userDoc.exists() ? userDoc.data() : undefined;
            return data?.currentFamilyId ?? null;
        } catch (error) {
            console.warn('FamilyService getCurrentFamilyId error', error);
            return null;
        }
    }

    // Listen in real-time to changes of `currentFamilyId` on the user document.
    // Returns an unsubscribe function to stop listening.
    listenToCurrentFamilyId(callback: (familyId: string | null) => void): () => void {
        if (!this.currentUserId) {
            callback(null);
            return () => { };
        }
        const userDocRef = doc(db, 'users', this.currentUserId);
        return onSnapshot(
            userDocRef,
            (snap) => {
                const data = snap.data() as any | undefined;
                callback(data?.currentFamilyId ?? null);
            },
            (error) => {
                console.error('FamilyService listenToCurrentFamilyId error', error);
                callback(null);
            },
        );
    }

    // Fetch list of families (id & name) the current user belongs to
    async getUserFamilies(): Promise<{ id: string; name: string }[]> {
        try {
            if (!this.currentUserId) return [];

            const userSnap = await getDoc(doc(db, 'users', this.currentUserId));
            if (!userSnap.exists()) return [];

            const data = userSnap.data();
            const familyIds: string[] = data?.familyIds ?? [];
            if (familyIds.length === 0) return [];

            const promises = familyIds.map(async (familyId) => {
                const familyDoc = await getDoc(doc(db, 'families', familyId));
                return familyDoc.exists() ?
                    { id: familyDoc.id, name: familyDoc.data().name ?? 'Family' } :
                    null;
            });

            const results = await Promise.all(promises);
            return results.filter(result => result !== null) as { id: string; name: string }[];
        } catch (error) {
            console.warn('FamilyService getUserFamilies error', error);
            return [];
        }
    }

    // Listen to real-time changes in user's family list
    listenToUserFamilies(callback: (families: { id: string; name: string }[]) => void): () => void {
        if (!this.currentUserId) {
            callback([]);
            return () => { };
        }

        const userDocRef = doc(db, 'users', this.currentUserId);
        return onSnapshot(
            userDocRef,
            async (snap) => {
                if (!snap.exists()) {
                    callback([]);
                    return;
                }

                const data = snap.data();
                const familyIds: string[] = data?.familyIds ?? [];
                if (familyIds.length === 0) {
                    callback([]);
                    return;
                }

                try {
                    const promises = familyIds.map(async (familyId) => {
                        const familyDoc = await getDoc(doc(db, 'families', familyId));
                        return familyDoc.exists() ?
                            { id: familyDoc.id, name: familyDoc.data().name ?? 'Family' } :
                            null;
                    });

                    const results = await Promise.all(promises);
                    const families = results.filter(result => result !== null) as { id: string; name: string }[];
                    callback(families);
                } catch (error) {
                    console.warn('FamilyService listenToUserFamilies error', error);
                    callback([]);
                }
            },
            (error) => {
                console.error('FamilyService listenToUserFamilies error', error);
                callback([]);
            }
        );
    }

    // Switch the active family for the user
    async switchFamily(newFamilyId: string): Promise<void> {
        try {
            if (!this.currentUserId) return;

            await updateDoc(doc(db, 'users', this.currentUserId), {
                currentFamilyId: newFamilyId,
            });
        } catch (error) {
            console.warn('FamilyService switchFamily error', error);
            throw new Error(`Failed to switch family: ${error}`);
        }
    }

    /**
     * Update family name (admin only). Does NOT change other fields.
     */
    async updateFamilyName(familyId: string, newName: string): Promise<void> {
        try {
            if (!this.currentUserId) throw new Error('Not signed in');
            if (!newName.trim()) throw new Error('Name cannot be empty');

            // Verify current user is admin of this family
            const members = await this.getFamilyMembers(familyId);
            const me = members.find((m) => m.userId === this.currentUserId);
            if (!me || me.role !== FamilyMemberRole.ADMIN) {
                throw new Error('Only admins can rename the family');
            }

            await updateDoc(doc(db, 'families', familyId), {
                name: newName.trim(),
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('updateFamilyName error', error);
            throw error;
        }
    }

    /**
     * Deletes an entire family and all associated data.
     * This action is permanent and can only be performed by the family admin.
     * It will:
     * - Remove the family association from all members' user profiles.
     * - Delete all pending invitations for the family.
     * - Delete all subcollections (activities, pantry).
     * - Delete the familyMembers document.
     * - Delete the main family document.
     * - Attempt to switch the admin to another family if they belong to others.
     */
    async deleteFamily(familyId: string, adminId: string): Promise<{ switchedToFamily?: { id: string; name: string } }> {
        if (!this.currentUserId || this.currentUserId !== adminId) {
            throw new Error("No user is currently signed in or you are not the admin.");
        }

        const familyDoc = await this.getFamily(familyId);
        if (!familyDoc) {
            throw new Error("Family not found.");
        }

        if (familyDoc.adminUserId !== this.currentUserId) {
            throw new Error("Only the family admin can delete the family.");
        }

        try {
            // 1. Get all members to update their user documents
            const members = await this.getFamilyMembers(familyId);

            // 2. Update all member user documents to remove family association
            const userUpdatePromises = members.map(async (member) => {
                const userRef = doc(db, 'users', member.userId);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const updateData: any = {
                        familyIds: arrayRemove(familyId)
                    };
                    if (userData.currentFamilyId === familyId) {
                        updateData.currentFamilyId = null;
                    }
                    return updateDoc(userRef, updateData);
                }
                return Promise.resolve();
            });

            // 3. Delete all pending invitations for the family
            const invitationsQuery = query(collection(db, 'familyInvitations'), where('familyId', '==', familyId));
            const invitationsSnapshot = await getDocs(invitationsQuery);
            const invitationDeletePromises = invitationsSnapshot.docs.map(invitationDoc =>
                deleteDoc(doc(db, 'familyInvitations', invitationDoc.id))
            );

            // 4. Delete family activities subcollection (if it exists)
            const activitiesQuery = query(collection(db, 'families', familyId, 'activities'));
            const activitiesSnapshot = await getDocs(activitiesQuery);
            const activityDeletePromises = activitiesSnapshot.docs.map(activityDoc =>
                deleteDoc(doc(db, 'families', familyId, 'activities', activityDoc.id))
            );

            // 5. Delete family pantry subcollection (if it exists)
            const pantryQuery = query(collection(db, 'families', familyId, 'pantry'));
            const pantrySnapshot = await getDocs(pantryQuery);
            const pantryDeletePromises = pantrySnapshot.docs.map(pantryDoc =>
                deleteDoc(doc(db, 'families', familyId, 'pantry', pantryDoc.id))
            );

            // 6. Execute all user updates and deletions in parallel
            await Promise.all([
                ...userUpdatePromises,
                ...invitationDeletePromises,
                ...activityDeletePromises,
                ...pantryDeletePromises
            ]);

            // 7. Delete the familyMembers document
            await deleteDoc(doc(db, 'familyMembers', familyId));

            // 8. Delete the main family document
            await deleteDoc(doc(db, 'families', familyId));

            // 9. If the deleted family was the current family, try to switch to another family
            let switchedToFamily: { id: string; name: string } | undefined;
            if (familyId === await this.getCurrentFamilyId()) {
                const userFamilies = await this.getUserFamilies();
                if (userFamilies.length > 0) {
                    // Switch to the first available family
                    await this.switchFamily(userFamilies[0].id);
                    switchedToFamily = userFamilies[0];
                }
            }

            return { switchedToFamily };
        } catch (error) {
            console.error('Error deleting family:', error);
            throw new Error(`Failed to delete family: ${error}`);
        }
    }

    // Get pending invitations for a family
    listenToPendingInvitations(
        familyId: string,
        callback: (invitations: FamilyInvitation[]) => void
    ): () => void {
        const q = query(
            collection(db, 'familyInvitations'),
            where('familyId', '==', familyId),
            where('status', '==', InvitationStatus.PENDING)
        );

        return onSnapshot(q, (snapshot) => {
            const invitations = snapshot.docs.map(doc => familyInvitationFromFirestore(doc));
            callback(invitations);
        }, (error) => {
            console.error('Error listening to pending invitations:', error);
            callback([]);
        });
    }

    // Get invitations for current user's email
    async getUserInvitations(): Promise<FamilyInvitation[]> {
        try {
            if (!this.currentUserId || !auth.currentUser?.email) return [];

            const q = query(
                collection(db, 'familyInvitations'),
                where('inviteeEmail', '==', auth.currentUser.email.toLowerCase()),
                where('status', '==', InvitationStatus.PENDING)
            );

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => familyInvitationFromFirestore(doc));
        } catch (error) {
            console.error('Error getting user invitations:', error);
            return [];
        }
    }

    // Listen to invitations for current user
    listenToUserInvitations(callback: (invitations: FamilyInvitation[]) => void): () => void {
        if (!this.currentUserId || !auth.currentUser?.email) {
            return () => { };
        }

        const q = query(
            collection(db, 'familyInvitations'),
            where('inviteeEmail', '==', auth.currentUser.email.toLowerCase()),
            where('status', '==', InvitationStatus.PENDING)
        );

        return onSnapshot(q, (snapshot) => {
            const invitations = snapshot.docs.map(doc => familyInvitationFromFirestore(doc));
            callback(invitations);
        }, (error) => {
            console.error('Error listening to user invitations:', error);
            callback([]);
        });
    }

    // Decline invitation
    async declineInvitation(invitationId: string): Promise<void> {
        try {
            await updateDoc(doc(db, 'familyInvitations', invitationId), {
                status: InvitationStatus.DECLINED,
                respondedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error declining invitation:', error);
            throw new Error(`Failed to decline invitation: ${error}`);
        }
    }
}

export const familyService = FamilyService.instance; 