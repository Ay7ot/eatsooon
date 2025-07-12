import CustomAppBar from '@/components/ui/CustomAppBar';
import { Colors } from '@/constants/Colors';
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
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function FamilyMembersScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [currentFamily, setCurrentFamily] = useState<FamilyModel | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [pendingInvitations, setPendingInvitations] = useState<FamilyInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);

    // Modal states
    const [createFamilyModal, setCreateFamilyModal] = useState(false);
    const [inviteMemberModal, setInviteMemberModal] = useState(false);
    const [joinFamilyModal, setJoinFamilyModal] = useState(false);

    // Form states
    const [familyName, setFamilyName] = useState('');
    const [memberEmail, setMemberEmail] = useState('');
    const [invitationCode, setInvitationCode] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadFamilyData();
    }, []);

    const loadFamilyData = async () => {
        try {
            setLoading(true);
            const familyId = await familyService.getCurrentFamilyId();
            setCurrentFamilyId(familyId);

            if (familyId) {
                // Load family details
                const family = await familyService.getFamily(familyId);
                setCurrentFamily(family);

                // Listen to family members
                const unsubscribeMembers = familyService.listenToFamilyMembers(familyId, (members) => {
                    setFamilyMembers(members);
                });

                // Listen to pending invitations
                const unsubscribeInvitations = familyService.listenToPendingInvitations(familyId, (invitations) => {
                    setPendingInvitations(invitations);
                });

                return () => {
                    unsubscribeMembers();
                    unsubscribeInvitations();
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
            Alert.alert('Error', t('family_members_name_required'));
            return;
        }

        if (familyName.trim().length < 3) {
            Alert.alert('Error', t('family_members_name_short'));
            return;
        }

        try {
            setFormLoading(true);
            await familyService.createFamily(familyName.trim());
            setCreateFamilyModal(false);
            setFamilyName('');
            Alert.alert('Success', t('family_members_created_success'));
            loadFamilyData();
        } catch (error) {
            Alert.alert('Error', t('family_members_create_failed') + (error as Error).message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleInviteMember = async () => {
        if (!memberEmail.trim()) {
            Alert.alert('Error', t('family_members_email_required'));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(memberEmail.trim())) {
            Alert.alert('Error', t('family_members_email_invalid'));
            return;
        }

        if (!currentFamilyId) return;

        try {
            setFormLoading(true);
            await familyService.inviteMember(currentFamilyId, memberEmail.trim());
            setInviteMemberModal(false);
            setMemberEmail('');
            Alert.alert('Success', t('family_members_invite_sent'));
        } catch (error) {
            Alert.alert('Error', t('family_members_invite_failed') + (error as Error).message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleJoinFamily = async () => {
        if (!invitationCode.trim()) {
            Alert.alert('Error', 'Please enter the invitation code');
            return;
        }

        try {
            setFormLoading(true);
            await familyService.acceptInvitation(invitationCode.trim());
            setJoinFamilyModal(false);
            setInvitationCode('');
            Alert.alert('Success', 'Successfully joined family!');
            loadFamilyData();
        } catch (error) {
            Alert.alert('Error', 'Failed to join family: ' + (error as Error).message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleRemoveMember = (member: FamilyMember) => {
        Alert.alert(
            t('family_members_remove_dialog_title'),
            t('family_members_remove_dialog_desc').replace('{{name}}', member.displayName),
            [
                { text: t('family_members_cancel'), style: 'cancel' },
                {
                    text: t('family_members_remove'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!currentFamilyId) return;
                            await familyService.removeMember(currentFamilyId, member.userId);
                            Alert.alert('Success', t('family_members_removed_success').replace('{{name}}', member.displayName));
                        } catch (error) {
                            Alert.alert('Error', t('family_members_remove_failed') + (error as Error).message);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (date: Date): string => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const getTimeAgo = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) {
            return days === 1 ? t('family_members_day_ago').replace('{{count}}', '1') :
                t('family_members_days_ago').replace('{{count}}', days.toString());
        } else if (hours > 0) {
            return hours === 1 ? t('family_members_hour_ago').replace('{{count}}', '1') :
                t('family_members_hours_ago').replace('{{count}}', hours.toString());
        } else if (minutes > 0) {
            return minutes === 1 ? t('family_members_minute_ago').replace('{{count}}', '1') :
                t('family_members_minutes_ago').replace('{{count}}', minutes.toString());
        } else {
            return t('family_members_just_now');
        }
    };

    const currentUserMember = familyMembers.find(member => member.userId === user?.uid);
    const isCurrentUserAdmin = currentUserMember ? isAdmin(currentUserMember) : false;

    if (loading) {
        return (
            <View style={styles.container}>
                <CustomAppBar title="Eatsooon" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.secondaryColor} />
                    <Text style={styles.loadingText}>{t('family_members_loading')}</Text>
                </View>
            </View>
        );
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
                            <Text style={styles.primaryButtonText}>{t('family_members_create')}</Text>
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
                                <Text style={styles.familyName}>{currentFamily.name}</Text>
                                <Text style={styles.familyDescription}>
                                    {t('family_members_managing_pantry').replace('{{date}}', formatDate(currentFamily.createdAt))}
                                </Text>
                            </View>
                        )}

                        {/* Family Stats */}
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: Colors.secondaryColor }]}>{familyMembers.length}</Text>
                                <Text style={styles.statLabel}>{t('family_members_members')}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: Colors.orange }]}>0</Text>
                                <Text style={styles.statLabel}>{t('family_members_items_added')}</Text>
                            </View>
                        </View>

                        {/* Members Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('family_members_family_members')}</Text>

                            {familyMembers.map((member) => (
                                <View key={member.userId} style={styles.memberCard}>
                                    <View style={styles.memberAvatar}>
                                        {member.profileImage ? (
                                            <Image source={{ uri: member.profileImage }} style={styles.avatarImage} />
                                        ) : (
                                            <Text style={styles.avatarText}>
                                                {member.displayName.charAt(0).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{member.displayName}</Text>
                                        <Text style={styles.memberEmail}>{member.email}</Text>
                                        <Text style={styles.memberJoined}>
                                            {t('family_members_joined').replace('{{time}}', getTimeAgo(member.joinedAt))}
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
                                    <Text style={styles.modalButtonPrimaryText}>{t('family_members_create')}</Text>
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
}); 