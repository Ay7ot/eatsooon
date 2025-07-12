export interface FamilySettings {
    allowMemberInvites: boolean;
    requireApprovalForDeletion: boolean;
}

export interface FamilyStatistics {
    totalItems: number;
    wasteReduced: number;
    memberCount: number;
}

export interface FamilyModel {
    id: string;
    name: string;
    adminUserId: string;
    createdAt: Date;
    updatedAt?: Date;
    settings: FamilySettings;
    statistics: FamilyStatistics;
}

export enum FamilyMemberRole {
    ADMIN = 'admin',
    MEMBER = 'member'
}

export enum FamilyMemberStatus {
    ACTIVE = 'active',
    PENDING = 'pending',
    INACTIVE = 'inactive'
}

export interface FamilyMember {
    userId: string;
    familyId: string;
    displayName: string;
    email: string;
    profileImage?: string;
    role: FamilyMemberRole;
    status: FamilyMemberStatus;
    joinedAt: Date;
    lastActiveAt?: Date;
    itemsAddedThisMonth: number;
}

export enum InvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    EXPIRED = 'expired'
}

export interface FamilyInvitation {
    id: string;
    familyId: string;
    familyName: string;
    inviterUserId: string;
    inviterName: string;
    inviteeEmail: string;
    status: InvitationStatus;
    createdAt: Date;
    expiresAt: Date;
    respondedAt?: Date;
}

// Helper functions for models
export const familyMemberFromFirestore = (data: any, userId: string, familyId: string): FamilyMember => {
    return {
        userId,
        familyId,
        displayName: data.displayName || '',
        email: data.email || '',
        profileImage: data.profileImage,
        role: data.role === 'admin' ? FamilyMemberRole.ADMIN : FamilyMemberRole.MEMBER,
        status: data.status === 'active' ? FamilyMemberStatus.ACTIVE :
            data.status === 'pending' ? FamilyMemberStatus.PENDING : FamilyMemberStatus.INACTIVE,
        joinedAt: data.joinedAt?.toDate() || new Date(),
        lastActiveAt: data.lastActiveAt?.toDate(),
        itemsAddedThisMonth: data.itemsAddedThisMonth || 0,
    };
};

export const familyMemberToFirestore = (member: FamilyMember) => {
    return {
        displayName: member.displayName,
        email: member.email,
        profileImage: member.profileImage,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
        lastActiveAt: member.lastActiveAt,
        itemsAddedThisMonth: member.itemsAddedThisMonth,
    };
};

export const familyFromFirestore = (doc: any): FamilyModel => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name || '',
        adminUserId: data.adminUserId || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        settings: {
            allowMemberInvites: data.settings?.allowMemberInvites ?? true,
            requireApprovalForDeletion: data.settings?.requireApprovalForDeletion ?? false,
        },
        statistics: {
            totalItems: data.statistics?.totalItems || 0,
            wasteReduced: data.statistics?.wasteReduced || 0,
            memberCount: data.statistics?.memberCount || 1,
        },
    };
};

export const familyToFirestore = (family: Omit<FamilyModel, 'id'>) => {
    return {
        name: family.name,
        adminUserId: family.adminUserId,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt || new Date(),
        settings: family.settings,
        statistics: family.statistics,
    };
};

export const familyInvitationFromFirestore = (doc: any): FamilyInvitation => {
    const data = doc.data();
    return {
        id: doc.id,
        familyId: data.familyId || '',
        familyName: data.familyName || '',
        inviterUserId: data.inviterUserId || '',
        inviterName: data.inviterName || '',
        inviteeEmail: data.inviteeEmail || '',
        status: data.status === 'accepted' ? InvitationStatus.ACCEPTED :
            data.status === 'declined' ? InvitationStatus.DECLINED :
                data.status === 'expired' ? InvitationStatus.EXPIRED : InvitationStatus.PENDING,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        respondedAt: data.respondedAt?.toDate(),
    };
};

export const familyInvitationToFirestore = (invitation: Omit<FamilyInvitation, 'id'>) => {
    return {
        familyId: invitation.familyId,
        familyName: invitation.familyName,
        inviterUserId: invitation.inviterUserId,
        inviterName: invitation.inviterName,
        inviteeEmail: invitation.inviteeEmail,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        respondedAt: invitation.respondedAt,
    };
};

// Helper getters for FamilyMember
export const isAdmin = (member: FamilyMember): boolean => member.role === FamilyMemberRole.ADMIN;
export const isActive = (member: FamilyMember): boolean => member.status === FamilyMemberStatus.ACTIVE;
export const isPending = (member: FamilyMember): boolean => member.status === FamilyMemberStatus.PENDING;

export const getRoleDisplayName = (role: FamilyMemberRole): string => {
    return role === FamilyMemberRole.ADMIN ? 'Admin' : 'Member';
};

export const getStatusDisplayName = (status: FamilyMemberStatus): string => {
    switch (status) {
        case FamilyMemberStatus.ACTIVE: return 'Active';
        case FamilyMemberStatus.PENDING: return 'Pending';
        case FamilyMemberStatus.INACTIVE: return 'Inactive';
    }
};

// Helper getters for FamilyInvitation
export const isInvitationPending = (invitation: FamilyInvitation): boolean =>
    invitation.status === InvitationStatus.PENDING;

export const isInvitationExpired = (invitation: FamilyInvitation): boolean =>
    new Date() > invitation.expiresAt || invitation.status === InvitationStatus.EXPIRED;

export const getInvitationTimeAgo = (invitation: FamilyInvitation): string => {
    const now = new Date();
    const diff = now.getTime() - invitation.createdAt.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (hours > 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (minutes > 0) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
        return 'Just now';
    }
}; 