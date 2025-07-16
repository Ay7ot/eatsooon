import CustomAppBar from '@/components/ui/CustomAppBar';
import Toast from '@/components/ui/Toast';
import { Colors } from '@/constants/Colors';
import { useAppInventory } from '@/src/hooks/useAppInventory';
import {
    FamilyInvitation,
    FamilyMember,
    FamilyModel,
    getInvitationTimeAgo,
    getRoleDisplayName,
    isAdmin
} from '@/src/models/FamilyModel';
import { useAuth } from '@/src/services/AuthContext';
import { familyService } from '@/src/services/FamilyService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

export default function FamilyMembersScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { stats: inventoryStats, isLoading: isInventoryLoading } = useAppInventory('family');

    // Redirect to sign-in if not authenticated
    if (!user) {
        router.replace('/(auth)/sign-in');
        return null;
    }

    const [currentFamily, setCurrentFamily] = useState<FamilyModel | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);

    // Modal states
    const [createFamilyModal, setCreateFamilyModal] = useState(false);
    const [inviteMemberModal, setInviteMemberModal] = useState(false);
    const [joinFamilyModal, setJoinFamilyModal] = useState(false);
    const [confirmRemoveModal, setConfirmRemoveModal] = useState(false);
    // Edit family name
    const [editNameModal, setEditNameModal] = useState(false);
    const [confirmDeleteFamilyModal, setConfirmDeleteFamilyModal] = useState(false);
    const [newFamilyName, setNewFamilyName] = useState('');
    const [toast, setToast] = useState<{
        visible: boolean;
        type: 'success' | 'error';
        message: string;
    }>({
        visible: false,
        type: 'success',
        message: ''
    });

    // Form states
    const [familyName, setFamilyName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [invitationCode, setInvitationCode] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [deleteFamilyLoading, setDeleteFamilyLoading] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const initializeData = async () => {
            cleanup = await loadFamilyData();
        };

        initializeData();

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [user]);

    // Helper functions for showing modals
    const showSuccessMessage = (title: string, message: string) => {
        setToast({
            visible: true,
            type: 'success',
            message
        });
    };

    const showErrorMessage = (title: string, message: string) => {
        setToast({
            visible: true,
            type: 'error',
            message
        });
    };

    const hideMessageModal = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    const loadFamilyData = async () => {
        try {
            setLoading(true);
            const familyId = await familyService.getCurrentFamilyId();
            setCurrentFamilyId(familyId);

            if (familyId) {
                // Load family details
                const family = await familyService.getFamily(familyId);
                setCurrentFamily(family);

                let unsubscribeInvitations: (() => void) | null = null;

                // Listen to family members
                const unsubscribeMembers = familyService.listenToFamilyMembers(familyId, (members) => {
                    setFamilyMembers(members);

                    const currentUserIsAdmin = members.some(m => m.userId === user?.uid && isAdmin(m));

                    // If user is admin and we don't have a listener yet, create one.
                    if (currentUserIsAdmin && !unsubscribeInvitations) {
                        unsubscribeInvitations = familyService.listenToPendingInvitations(familyId, (invitations) => {
                            setPendingInvitations(invitations);
                        });
                    }
                    // If user is NOT admin, clear invitations and unsubscribe if we had a listener.
                    else if (!currentUserIsAdmin) {
                        setPendingInvitations([]);
                        if (unsubscribeInvitations) {
                            unsubscribeInvitations();
                            unsubscribeInvitations = null;
                        }
                    }
                });


                return () => {
                    unsubscribeMembers();
                    if (unsubscribeInvitations) {
                        unsubscribeInvitations();
                    }
                };
            }
        } catch (error) {
            console.error('Error loading family data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFamily = async () => {
        if (!familyName.trim()) {
            showErrorMessage('Error', t('family_members_name_required'));
            return;
        }

        if (familyName.trim().length < 3) {
            showErrorMessage('Error', t('family_members_name_short'));
            return;
        }

        setFormLoading(true);
        try {
            await familyService.createFamily(familyName.trim());
            setCreateFamilyModal(false);
            setFamilyName('');
            await loadFamilyData(); // Re-load data to show the new family
            showSuccessMessage('Success!', t('family_members_created_success'));
        } catch (error) {
            showErrorMessage('Creation Failed', (error as Error).message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleInviteMember = async () => {
        if (!memberEmail.trim()) {
            showErrorMessage('Error', t('family_members_email_required'));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(memberEmail.trim())) {
            showErrorMessage('Error', t('family_members_email_invalid'));
            return;
        }

        if (!currentFamilyId) return;

        setFormLoading(true);
        try {
            await familyService.inviteMember(currentFamilyId, memberEmail.trim());
            setInviteMemberModal(false);
            setMemberEmail('');
            showSuccessMessage('Success', t('family_members_invite_sent'));
        } catch (error) {
            showErrorMessage('Invite Failed', (error as Error).message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleJoinFamily = async () => {
        if (!invitationCode.trim()) {
            showErrorMessage('Error', 'Please enter the invitation code');
            return;
        }

        setFormLoading(true);
        try {
            await familyService.acceptInvitation(invitationCode.trim());
            setJoinFamilyModal(false);
            setInvitationCode('');
            await loadFamilyData();
            showSuccessMessage('Success!', 'Successfully joined family!');
        } catch (error) {
            showErrorMessage('Join Failed', 'Failed to join family: ' + (error as Error).message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleRemoveMember = (member: FamilyMember) => {
        setMemberToRemove(member);
        setConfirmRemoveModal(true);
    };

    const confirmRemoveMember = async () => {
        if (!memberToRemove || !currentFamilyId) return;

        try {
            await familyService.removeMember(currentFamilyId, memberToRemove.userId);
            setConfirmRemoveModal(false);
            setMemberToRemove(null);
            showSuccessMessage('Success', t('family_members_removed_success').replace('{{name}}', memberToRemove.displayName));
        } catch (error) {
            showErrorMessage('Error', t('family_members_remove_failed') + (error as Error).message);
        }
    };

    const handleDeleteFamily = async () => {
        if (!currentFamilyId) return;

        setDeleteFamilyLoading(true);
        try {
            const result = await familyService.deleteFamily(currentFamilyId);
            setConfirmDeleteFamilyModal(false);
            
            if (result.switchedToFamily) {
                showSuccessMessage('Success', t('family_members_delete_family_switched', { familyName: result.switchedToFamily.name }));
            } else {
                showSuccessMessage('Success', t('family_members_delete_family_success'));
            }
            
            // After deletion, re-load data
            loadFamilyData();
        } catch (error) {
            showErrorMessage('Error', t('family_members_delete_family_failed') + (error as Error).message);
        } finally {
            setDeleteFamilyLoading(false);
        }
    };

    const formatDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getTimeAgo = (date: Date): string => {

        // Handle invalid dates
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
            return t('family_members_just_now');
        }

        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));


        if (days > 0) {
            return days === 1 ? t('family_members_day_ago', { count: 1 }) :
                t('family_members_days_ago', { count: days });
        } else if (hours > 0) {
            return hours === 1 ? t('family_members_hour_ago', { count: 1 }) :
                t('family_members_hours_ago', { count: hours });
        } else if (minutes > 0) {
            return minutes === 1 ? t('family_members_minute_ago', { count: 1 }) :
                t('family_members_minutes_ago', { count: minutes });
        } else {
            return t('family_members_just_now');
        }
    };

    const currentUserMember = familyMembers.find(member => member.userId === user?.uid);
    const isCurrentUserAdmin = currentUserMember ? isAdmin(currentUserMember) : false;

    if (loading) {
        return <FamilyMembersSkeleton />;
    }

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={Colors.textSecondary} />
                </Pressable>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('family_members_title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('family_members_subtitle')}</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {!currentFamilyId ? (
                    // No Family State
                    <View style={styles.noFamilyContainer}>
                        <View style={styles.noFamilyIcon}>
                            <MaterialIcons name="groups" size={40} color={Colors.secondaryColor} />
                        </View>
                        <Text style={styles.noFamilyTitle}>{t('family_members_no_family')}</Text>
                        <Text style={styles.noFamilyDescription}>{t('family_members_no_family_desc')}</Text>

                        <Pressable style={styles.primaryButton} onPress={() => setCreateFamilyModal(true)}>
                            <Text style={styles.primaryButtonText}>{t('family_members_create_family')}</Text>
                        </Pressable>

                        <Pressable style={styles.secondaryButton} onPress={() => setJoinFamilyModal(true)}>
                            <Text style={styles.secondaryButtonText}>{t('family_members_enter_code')}</Text>
                        </Pressable>
                    </View>
                ) : (
                    // Family Content
                    <View style={styles.familyContent}>
                        {/* Family Header */}
                        {currentFamily && (
                            <View style={styles.familyHeader}>
                                <View style={styles.familyAvatar}>
                                    <MaterialIcons name="groups" size={40} color={Colors.secondaryColor} />
                                </View>
                                <View style={styles.familyNameRow}>
                                    <Text style={styles.familyName}>{currentFamily.name}</Text>
                                    {isCurrentUserAdmin && (
                                        <Pressable onPress={() => {
                                            setNewFamilyName(currentFamily.name);
                                            setEditNameModal(true);
                                        }}>
                                            <MaterialIcons name="edit" size={18} color={Colors.textSecondary} />
                                        </Pressable>
                                    )}
                                </View>
                                <Text style={styles.familyDescription}>
                                    {t('family_members_managing_pantry').replace('{{date}}', formatDate(currentFamily.createdAt))}
                                </Text>
                            </View>
                        )}

                        {/* Family Inventory Stats */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('family_inventory_stats_title', "Family's Pantry")}</Text>
                            {isInventoryLoading ? (
                                <View style={[styles.statsContainer, { backgroundColor: '#F3F4F6' }]} />
                            ) : (
                                <View style={styles.statsContainer}>
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: Colors.secondaryColor }]}>{inventoryStats.total}</Text>
                                        <Text style={styles.statLabel}>{t('inventory_total')}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: Colors.orange }]}>{inventoryStats.expiringSoon}</Text>
                                        <Text style={styles.statLabel}>{t('inventory_expiring')}</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={[styles.statValue, { color: Colors.red }]}>{inventoryStats.expired}</Text>
                                        <Text style={styles.statLabel}>{t('inventory_tab_expired')}</Text>
                                    </View>
                                </View>
                            )}
                        </View>


                        {/* Members Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('family_members_family_members')}</Text>

                            {familyMembers.map((member) => (
                                <View key={member.userId} style={styles.memberCard}>
                                    <View style={styles.memberAvatar}>
                                        <Text style={styles.avatarText}>
                                            {member.displayName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{member.displayName}</Text>
                                        <Text style={styles.memberEmail}>{member.email}</Text>
                                        <Text style={styles.memberJoined}>
                                            {t('family_members_joined').replace('{{timeAgo}}', getTimeAgo(member.joinedAt))}
                                        </Text>
                                    </View>
                                    <View style={styles.memberActions}>
                                        {member.userId === user?.uid ? (
                                            <View style={styles.youBadge}>
                                                <Text style={styles.youBadgeText}>You</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.roleBadge, {
                                                backgroundColor: isAdmin(member) ? Colors.red + '1A' : Colors.secondaryColor + '1A'
                                            }]}>
                                                <Text style={[styles.roleBadgeText, {
                                                    color: isAdmin(member) ? Colors.red : Colors.secondaryColor
                                                }]}>{getRoleDisplayName(member.role)}</Text>
                                            </View>
                                        )}
                                        {isCurrentUserAdmin && member.userId !== user?.uid && (
                                            <Pressable
                                                style={styles.removeButton}
                                                onPress={() => handleRemoveMember(member)}
                                            >
                                                <MaterialIcons name="close" size={18} color={Colors.textTertiary} />
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            ))}

                            {/* Pending Invitations */}
                            {pendingInvitations.map((invitation) => (
                                <View key={invitation.id} style={styles.invitationCard}>
                                    <View style={styles.invitationIcon}>
                                        <MaterialIcons name="mail-outline" size={20} color={Colors.orange} />
                                    </View>
                                    <View style={styles.invitationInfo}>
                                        <Text style={styles.invitationEmail}>{invitation.inviteeEmail}</Text>
                                        <Text style={styles.invitationStatus}>
                                            Pending · Sent {getInvitationTimeAgo(invitation)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <Pressable style={styles.actionButton} onPress={() => setCreateFamilyModal(true)}>
                                <MaterialIcons name="home-work" size={18} color={Colors.backgroundWhite} />
                                <Text style={styles.actionButtonText}>{t('family_members_new_family')}</Text>
                            </Pressable>
                            <Pressable style={styles.actionButtonSecondary} onPress={() => setInviteMemberModal(true)}>
                                <MaterialIcons name="person-add" size={18} color={Colors.secondaryColor} />
                                <Text style={styles.actionButtonSecondaryText}>{t('family_members_invite_member')}</Text>
                            </Pressable>
                        </View>

                        {isCurrentUserAdmin && (
                            <View style={{ marginTop: 12 }}>
                                <Pressable
                                    style={[styles.dangerButton, deleteFamilyLoading && styles.disabledButton]}
                                    onPress={() => setConfirmDeleteFamilyModal(true)}
                                    disabled={deleteFamilyLoading}
                                >
                                    <MaterialIcons name="delete-forever" size={18} color={Colors.red} />
                                    <Text style={styles.dangerButtonText}>{t('family_members_delete_family')}</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Create Family Modal */}
            <Modal visible={createFamilyModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <MaterialIcons name="groups" size={32} color={Colors.secondaryColor} />
                        </View>
                        <Text style={styles.modalTitle}>{t('family_members_create_dialog_title')}</Text>
                        <Text style={styles.modalDescription}>{t('family_members_create_dialog_desc')}</Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder={t('family_members_family_name')}
                            value={familyName}
                            onChangeText={setFamilyName}
                            placeholderTextColor={Colors.textTertiary}
                        />

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalButtonSecondary}
                                onPress={() => {
                                    setCreateFamilyModal(false);
                                    setFamilyName('');
                                }}
                                disabled={formLoading}
                            >
                                <Text style={styles.modalButtonSecondaryText}>{t('family_members_cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalButtonPrimary}
                                onPress={handleCreateFamily}
                                disabled={formLoading}
                            >
                                {formLoading ? (
                                    <ActivityIndicator size="small" color={Colors.backgroundWhite} />
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>{t('family_members_create_family')}</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Invite Member Modal */}
            <Modal visible={inviteMemberModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <MaterialIcons name="person-add" size={32} color={Colors.secondaryColor} />
                        </View>
                        <Text style={styles.modalTitle}>{t('family_members_invite_dialog_title')}</Text>
                        <Text style={styles.modalDescription}>{t('family_members_invite_dialog_desc')}</Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder={t('family_members_email_address')}
                            value={memberEmail}
                            onChangeText={setMemberEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor={Colors.textTertiary}
                        />

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalButtonSecondary}
                                onPress={() => {
                                    setInviteMemberModal(false);
                                    setMemberEmail('');
                                }}
                                disabled={formLoading}
                            >
                                <Text style={styles.modalButtonSecondaryText}>{t('family_members_cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalButtonPrimary}
                                onPress={handleInviteMember}
                                disabled={formLoading}
                            >
                                {formLoading ? (
                                    <ActivityIndicator size="small" color={Colors.backgroundWhite} />
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>{t('family_members_send_invite')}</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Join Family Modal */}
            <Modal visible={joinFamilyModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <MaterialIcons name="mail-outline" size={32} color={Colors.orange} />
                        </View>
                        <Text style={styles.modalTitle}>Enter Invitation Code</Text>
                        <Text style={styles.modalDescription}>Paste the invitation code sent to your email to join the family.</Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder="Invitation Code"
                            value={invitationCode}
                            onChangeText={setInvitationCode}
                            placeholderTextColor={Colors.textTertiary}
                        />

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalButtonSecondary}
                                onPress={() => {
                                    setJoinFamilyModal(false);
                                    setInvitationCode('');
                                }}
                                disabled={formLoading}
                            >
                                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalButtonPrimary}
                                onPress={handleJoinFamily}
                                disabled={formLoading}
                            >
                                {formLoading ? (
                                    <ActivityIndicator size="small" color={Colors.backgroundWhite} />
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>Join</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirm Remove Member Modal */}
            <Modal
                visible={confirmRemoveModal}
                transparent
                animationType="fade"
                statusBarTranslucent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIcon, { backgroundColor: Colors.red + '20' }]}>
                            <MaterialIcons name="person-remove" size={32} color={Colors.red} />
                        </View>
                        <Text style={styles.modalTitle}>{t('family_members_remove_dialog_title')}</Text>
                        <Text style={styles.modalDescription}>
                            {memberToRemove && t('family_members_remove_dialog_desc').replace('{{name}}', memberToRemove.displayName)}
                        </Text>

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalButtonSecondary}
                                onPress={() => {
                                    setConfirmRemoveModal(false);
                                    setMemberToRemove(null);
                                }}
                            >
                                <Text style={styles.modalButtonSecondaryText}>{t('family_members_cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButtonPrimary, { backgroundColor: Colors.red }]}
                                onPress={confirmRemoveMember}
                            >
                                <Text style={styles.modalButtonPrimaryText}>{t('family_members_remove')}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Confirm Delete Family Modal */}
            <Modal
                visible={confirmDeleteFamilyModal}
                transparent
                animationType="fade"
                statusBarTranslucent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIcon, { backgroundColor: Colors.red + '20' }]}>
                            <MaterialIcons name="warning" size={32} color={Colors.red} />
                        </View>
                        <Text style={styles.modalTitle}>{t('family_members_delete_family_dialog_title')}</Text>
                        <Text style={styles.modalDescription}>
                            {t('family_members_delete_family_dialog_desc')}
                        </Text>

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalButtonSecondary}
                                onPress={() => setConfirmDeleteFamilyModal(false)}
                                disabled={deleteFamilyLoading}
                            >
                                <Text style={styles.modalButtonSecondaryText}>{t('family_members_cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButtonPrimary, { backgroundColor: Colors.red }]}
                                onPress={handleDeleteFamily}
                                disabled={deleteFamilyLoading}
                            >
                                {deleteFamilyLoading ? (
                                    <ActivityIndicator size="small" color={Colors.backgroundWhite} />
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>{t('family_members_delete_family')}</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Name Modal */}
            <Modal visible={editNameModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <MaterialIcons name="edit" size={32} color={Colors.secondaryColor} />
                        </View>
                        <Text style={styles.modalTitle}>{t('family_members_edit_name_title', 'Edit Family Name')}</Text>

                        <TextInput
                            style={styles.textInput}
                            placeholder={t('family_members_family_name')}
                            value={newFamilyName}
                            onChangeText={setNewFamilyName}
                            placeholderTextColor={Colors.textTertiary}
                        />

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.modalButtonSecondary}
                                onPress={() => setEditNameModal(false)}
                                disabled={formLoading}
                            >
                                <Text style={styles.modalButtonSecondaryText}>{t('family_members_cancel')}</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalButtonPrimary}
                                onPress={async () => {
                                    if (!currentFamilyId) return;
                                    if (!newFamilyName.trim()) return;
                                    try {
                                        setFormLoading(true);
                                        await familyService.updateFamilyName(currentFamilyId, newFamilyName.trim());
                                        setEditNameModal(false);
                                        showSuccessMessage('Success', t('family_members_updated_success', 'Family name updated'));
                                        loadFamilyData();
                                    } catch (e) {
                                        showErrorMessage('Error', (e as Error).message);
                                    } finally {
                                        setFormLoading(false);
                                    }
                                }}
                                disabled={formLoading}
                            >
                                {formLoading ? (
                                    <ActivityIndicator size="small" color={Colors.backgroundWhite} />
                                ) : (
                                    <Text style={styles.modalButtonPrimaryText}>{t('family_members_save', 'Save')}</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Message Modal (Success/Error) */}
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={hideMessageModal}
            />
        </View>
    );
}

function FamilyMembersSkeleton() {
    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            {/* Header Skeleton */}
            <View style={styles.header}>
                <View style={[styles.backButton, styles.skeleton]} />
                <View style={styles.headerContent}>
                    <View style={[styles.skeleton, { width: 140, height: 18, marginBottom: 8, borderRadius: 4 }]} />
                    <View style={[styles.skeleton, { width: 200, height: 14, borderRadius: 4 }]} />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                {/* Family Header Skeleton */}
                <View style={[styles.familyHeader, styles.skeleton, { padding: 24, alignItems: 'center' }]}>
                    <View style={[styles.skeleton, { width: 80, height: 80, borderRadius: 40, marginBottom: 16 }]} />
                    <View style={[styles.skeleton, { width: '60%', height: 20, marginBottom: 8, borderRadius: 4 }]} />
                    <View style={[styles.skeleton, { width: '80%', height: 16, borderRadius: 4 }]} />
                </View>

                {/* Stats Skeleton */}
                <View style={[styles.statsContainer, styles.skeleton, { marginTop: 24, padding: 20 }]}>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={[styles.skeleton, { width: 40, height: 24, marginBottom: 4, borderRadius: 4 }]} />
                        <View style={[styles.skeleton, { width: 60, height: 12, borderRadius: 4 }]} />
                    </View>
                    <View style={styles.statDivider} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <View style={[styles.skeleton, { width: 40, height: 24, marginBottom: 4, borderRadius: 4 }]} />
                        <View style={[styles.skeleton, { width: 60, height: 12, borderRadius: 4 }]} />
                    </View>
                </View>

                {/* Members Section Skeleton */}
                <View style={styles.section}>
                    <View style={[styles.skeleton, { width: 150, height: 20, marginBottom: 16, borderRadius: 4 }]} />
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={[styles.memberCard, styles.skeleton, { marginBottom: 12 }]} />
                    ))}
                </View>

                {/* Action Buttons Skeleton */}
                <View style={styles.actionButtons}>
                    <View style={[styles.actionButton, styles.skeleton]} />
                    <View style={[styles.actionButtonSecondary, styles.skeleton, { borderWidth: 0 }]} />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.backgroundWhite,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderColor,
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: Colors.backgroundColor,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    content: {
        flex: 1,
    },
    // No Family State
    noFamilyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noFamilyIcon: {
        width: 80,
        height: 80,
        backgroundColor: Colors.secondaryColor + '20',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    noFamilyTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    noFamilyDescription: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    primaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: Colors.secondaryColor,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.borderColor,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    // Family Content
    familyContent: {
        padding: 20,
    },
    familyHeader: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    familyAvatar: {
        width: 80,
        height: 80,
        backgroundColor: Colors.backgroundColor,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: Colors.borderColor,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    familyNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    familyName: {
        fontFamily: 'Nunito-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    familyDescription: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        marginBottom: 4,
    },
    statLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.borderColor,
        marginHorizontal: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        padding: 16,
        marginBottom: 12,
    },
    memberAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.secondaryColor + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarText: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: Colors.secondaryColor,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontFamily: 'Nunito-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    memberEmail: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    memberJoined: {
        fontFamily: 'Inter-Regular',
        fontSize: 11,
        color: Colors.textTertiary,
    },
    memberActions: {
        alignItems: 'flex-end',
    },
    youBadge: {
        backgroundColor: Colors.orange + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    youBadgeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 11,
        color: Colors.orange,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 8,
    },
    roleBadgeText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
    },
    removeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    invitationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.orange + '10',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.orange + '30',
        padding: 16,
        marginBottom: 12,
    },
    invitationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.orange + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    invitationInfo: {
        flex: 1,
    },
    invitationEmail: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 15,
        color: Colors.orange,
        marginBottom: 2,
    },
    invitationStatus: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.orange,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.secondaryColor,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.backgroundWhite,
    },
    actionButtonSecondary: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.secondaryColor,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionButtonSecondaryText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.secondaryColor,
    },
    dangerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.red,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    dangerButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.red,
    },
    disabledButton: {
        opacity: 0.7,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        ...(Platform.OS === 'android' && {
            paddingTop: StatusBar.currentHeight || 0,
        }),
    },
    modalContent: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIcon: {
        width: 64,
        height: 64,
        backgroundColor: Colors.secondaryColor + '10',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    modalDescription: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    textInput: {
        borderWidth: 1,
        borderColor: Colors.borderColor,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButtonSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        borderRadius: 12,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonSecondaryText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    modalButtonPrimary: {
        flex: 1,
        backgroundColor: Colors.secondaryColor,
        borderRadius: 12,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonPrimaryText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    // Skeleton styles
    skeletonText: {
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
    },
    skeleton: {
        backgroundColor: '#E5E7EB',
    },
}); 