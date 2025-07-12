import { Colors } from '@/constants/Colors';
import {
    FamilyInvitation,
    getInvitationTimeAgo,
    isInvitationExpired,
    isInvitationPending
} from '@/src/models/FamilyModel';
import { familyService } from '@/src/services/FamilyService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface Props {
    onInvitationAccepted?: () => void;
}

export default function InvitationList({ onInvitationAccepted }: Props) {
    const { t } = useTranslation();
    const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsubscribe = familyService.listenToUserInvitations((invitations) => {
            setInvitations(invitations);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleAcceptInvitation = async (invitation: FamilyInvitation) => {
        if (processingInvitations.has(invitation.id)) return;

        setProcessingInvitations(prev => new Set(prev).add(invitation.id));

        try {
            await familyService.acceptInvitation(invitation.id);
            Alert.alert('Success', t('invitations_accept_success'));
            onInvitationAccepted?.();
        } catch (error) {
            Alert.alert('Error', t('invitations_accept_failed') + (error as Error).message);
        } finally {
            setProcessingInvitations(prev => {
                const newSet = new Set(prev);
                newSet.delete(invitation.id);
                return newSet;
            });
        }
    };

    const handleDeclineInvitation = async (invitation: FamilyInvitation) => {
        if (processingInvitations.has(invitation.id)) return;

        Alert.alert(
            'Decline Invitation',
            `Are you sure you want to decline the invitation to join "${invitation.familyName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        setProcessingInvitations(prev => new Set(prev).add(invitation.id));

                        try {
                            await familyService.declineInvitation(invitation.id);
                            Alert.alert('Success', t('invitations_decline_success'));
                        } catch (error) {
                            Alert.alert('Error', t('invitations_decline_failed') + (error as Error).message);
                        } finally {
                            setProcessingInvitations(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(invitation.id);
                                return newSet;
                            });
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.secondaryColor} />
                <Text style={styles.loadingText}>Loading invitations...</Text>
            </View>
        );
    }

    if (invitations.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialIcons name="mail-outline" size={48} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>{t('invitations_no_pending')}</Text>
                <Text style={styles.emptySubtitle}>
                    Family invitations will appear here when you receive them.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('invitations_title')}</Text>
            {invitations.map((invitation) => (
                <InvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    isProcessing={processingInvitations.has(invitation.id)}
                    onAccept={() => handleAcceptInvitation(invitation)}
                    onDecline={() => handleDeclineInvitation(invitation)}
                />
            ))}
        </View>
    );
}

interface InvitationCardProps {
    invitation: FamilyInvitation;
    isProcessing: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

function InvitationCard({ invitation, isProcessing, onAccept, onDecline }: InvitationCardProps) {
    const { t } = useTranslation();
    const expired = isInvitationExpired(invitation);
    const pending = isInvitationPending(invitation);

    return (
        <View style={[
            styles.invitationCard,
            expired && styles.expiredCard
        ]}>
            <View style={styles.invitationIcon}>
                <MaterialIcons
                    name={expired ? "error-outline" : "mail"}
                    size={24}
                    color={expired ? Colors.red : Colors.secondaryColor}
                />
            </View>

            <View style={styles.invitationContent}>
                <Text style={styles.familyName}>{invitation.familyName}</Text>
                <Text style={styles.inviterName}>
                    Invited by {invitation.inviterName}
                </Text>
                <Text style={styles.invitationTime}>
                    {expired ? t('invitations_expired') : getInvitationTimeAgo(invitation)}
                </Text>
            </View>

            {pending && !expired && (
                <View style={styles.actionButtons}>
                    <Pressable
                        style={[styles.actionButton, styles.declineButton]}
                        onPress={onDecline}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color={Colors.red} />
                        ) : (
                            <Text style={[styles.actionButtonText, { color: Colors.red }]}>
                                {t('invitations_decline')}
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={onAccept}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color={Colors.backgroundWhite} />
                        ) : (
                            <Text style={[styles.actionButtonText, { color: Colors.backgroundWhite }]}>
                                {t('invitations_accept')}
                            </Text>
                        )}
                    </Pressable>
                </View>
            )}

            {expired && (
                <View style={styles.expiredBadge}>
                    <Text style={styles.expiredText}>{t('invitations_expired')}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    invitationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    expiredCard: {
        opacity: 0.6,
        backgroundColor: Colors.backgroundColor,
    },
    invitationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.secondaryColor + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    invitationContent: {
        flex: 1,
    },
    familyName: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    inviterName: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    invitationTime: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textTertiary,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    declineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.red,
    },
    acceptButton: {
        backgroundColor: Colors.secondaryColor,
    },
    actionButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
    },
    expiredBadge: {
        backgroundColor: Colors.red + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    expiredText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: Colors.red,
    },
}); 