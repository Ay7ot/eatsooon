import CustomAppBar from '@/components/ui/CustomAppBar';
import FamilySwitcher from '@/components/ui/FamilySwitcher';
import { Colors } from '@/constants/Colors';
import RecentActivity from '@/src/components/RecentActivity';
import { useAppInventory } from '@/src/hooks/useAppInventory';
import { useLanguage } from '@/src/localization/LanguageContext';
import { ActivityModel } from '@/src/models/ActivityModel';
import { activityService } from '@/src/services/ActivityService';
import { useAuth } from '@/src/services/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface UserStats {
    itemsAdded: number;
    recipesViewed: number;
    daysActive: number;
}

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();
    const [activities, setActivities] = useState<ActivityModel[]>([]);
    const [userStats, setUserStats] = useState<UserStats>({
        itemsAdded: 0,
        recipesViewed: 0,
        daysActive: 0,
    });
    const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
    const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { stats: inventoryStats, isLoading: isInventoryLoading } = useAppInventory('user');

    useEffect(() => {
        if (user) {
            // Listen to activities for stats calculation
            const unsubscribe = activityService.onActivitiesSnapshot({
                limit: 50, // Get more activities for better stats calculation
                next: (acts) => {
                    setActivities(acts);
                    calculateUserStats(acts);
                    setIsLoading(false);
                },
            });
            return unsubscribe;
        }
    }, [user]);

    const calculateUserStats = (activities: ActivityModel[]) => {
        const itemsAdded = activities.filter(a => a.type === 'itemAdded').length;
        const recipesViewed = activities.filter(a => a.type === 'recipeViewed').length;

        // Calculate days active based on unique days with activity
        const uniqueDays = new Set(
            activities.map(a => a.timestamp.toDateString())
        );
        const daysActive = uniqueDays.size;

        setUserStats({ itemsAdded, recipesViewed, daysActive });
    };

    const handleSignOut = () => {
        setIsSignOutModalVisible(true);
    };

    const confirmSignOut = () => {
        setIsSignOutModalVisible(false);
        signOut();
    };

    const handleLanguageChange = async (languageCode: string) => {
        await changeLanguage(languageCode);
        setIsLanguageModalVisible(false);
    };

    const renderSignOutModal = () => (
        <Modal
            visible={isSignOutModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsSignOutModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.signOutModalContent}>
                    {/* Warning Icon */}
                    <View style={styles.signOutIconContainer}>
                        <MaterialIcons name="logout" size={32} color={Colors.red} />
                    </View>

                    {/* Title */}
                    <Text style={styles.signOutTitle}>{t('profile_sign_out_confirm_title')}</Text>

                    {/* Message */}
                    <Text style={styles.signOutMessage}>{t('profile_sign_out_confirm_message')}</Text>

                    {/* Buttons */}
                    <View style={styles.signOutButtons}>
                        <Pressable
                            style={[styles.signOutButton, styles.cancelButton]}
                            onPress={() => setIsSignOutModalVisible(false)}
                        >
                            <Text style={styles.cancelButtonText}>{t('profile_cancel')}</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.signOutButton, styles.confirmButton]}
                            onPress={confirmSignOut}
                        >
                            <Text style={styles.confirmButtonText}>{t('profile_sign_out')}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderLanguageModal = () => (
        <Modal
            visible={isLanguageModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsLanguageModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>{t('language')}</Text>
                        <Text style={styles.modalSubtitle}>{t('change_language')}</Text>
                    </View>

                    {availableLanguages.map((language) => (
                        <Pressable
                            key={language.code}
                            style={[
                                styles.languageOption,
                                currentLanguage === language.code && styles.languageOptionSelected
                            ]}
                            onPress={() => handleLanguageChange(language.code)}
                        >
                            <View style={styles.languageOptionContent}>
                                <Text style={styles.languageOptionName}>{language.nativeName}</Text>
                                <Text style={styles.languageOptionCode}>{language.name}</Text>
                            </View>
                            {currentLanguage === language.code && (
                                <MaterialIcons name="check" size={24} color={Colors.secondaryColor} />
                            )}
                        </Pressable>
                    ))}

                    <Pressable
                        style={styles.modalCloseButton}
                        onPress={() => setIsLanguageModalVisible(false)}
                    >
                        <Text style={styles.modalCloseText}>{t('profile_cancel')}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );

    if (!user) {
        // Redirect to sign-in if user is not authenticated
        router.replace('/(auth)/sign-in');
        return null;
    }

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.userName}>
                        {user.displayName || 'User'}
                    </Text>
                    <Text style={styles.userEmail}>{user.email}</Text>

                    {/* Family switcher */}
                    <View style={{ marginTop: 12 }}>
                        <FamilySwitcher />
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{inventoryStats.total}</Text>
                        <Text style={styles.statLabel}>{t('profile_total_items', 'Your Items')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: Colors.red }]}>{inventoryStats.expired}</Text>
                        <Text style={styles.statLabel}>{t('profile_items_expired', 'Items Expired')}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={[styles.statValue, { color: Colors.orange }]}>{inventoryStats.expiringSoon}</Text>
                        <Text style={styles.statLabel}>{t('profile_expiring_soon', 'Expiring Soon')}</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile_quick_actions')}</Text>
                    <Text style={styles.sectionSubtitle}>{t('profile_actions_available')}</Text>

                    <View style={styles.actionsList}>
                        <Pressable
                            style={styles.actionItem}
                            onPress={() => router.push('/edit-profile')}
                        >
                            <View style={styles.actionIconContainer}>
                                <MaterialIcons name="edit" size={24} color={Colors.secondaryColor} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>{t('profile_edit_profile')}</Text>
                                <Text style={styles.actionSubtitle}>{t('profile_edit_profile_subtitle')}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.textTertiary} />
                        </Pressable>

                        <Pressable
                            style={styles.actionItem}
                            onPress={() => router.push('/family-members')}
                        >
                            <View style={styles.actionIconContainer}>
                                <MaterialIcons name="group" size={24} color={Colors.secondaryColor} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>{t('profile_family')}</Text>
                                <Text style={styles.actionSubtitle}>{t('profile_family_subtitle')}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.textTertiary} />
                        </Pressable>
                    </View>
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                    <RecentActivity limit={3} />
                </View>

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile_account')}</Text>

                    <View style={styles.actionsList}>
                        <Pressable
                            style={styles.actionItem}
                            onPress={() => setIsLanguageModalVisible(true)}
                        >
                            <View style={styles.actionIconContainer}>
                                <MaterialIcons name="language" size={24} color={Colors.secondaryColor} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>{t('language')}</Text>
                                <Text style={styles.actionSubtitle}>
                                    {availableLanguages.find(lang => lang.code === currentLanguage)?.nativeName || 'English'}
                                </Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.textTertiary} />
                        </Pressable>

                        <Pressable style={styles.actionItem} onPress={handleSignOut}>
                            <View style={styles.actionIconContainer}>
                                <MaterialIcons name="logout" size={24} color={Colors.red} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={[styles.actionTitle, { color: Colors.red }]}>{t('profile_sign_out')}</Text>
                                <Text style={styles.actionSubtitle}>{t('profile_sign_out_subtitle')}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color={Colors.textTertiary} />
                        </Pressable>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {renderLanguageModal()}
            {renderSignOutModal()}
        </View>
    );
}

function ProfileSkeleton() {
    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Header Skeleton */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatarContainer, { backgroundColor: '#E5E7EB' }]} />
                    <View style={[styles.skeletonText, { width: 120, height: 20, marginTop: 16 }]} />
                    <View style={[styles.skeletonText, { width: 180, height: 16, marginTop: 8 }]} />
                </View>

                {/* Stats Skeleton */}
                <View style={[styles.section, { marginTop: 32 }]}>
                    <View style={[styles.skeletonText, { width: 100, height: 18, marginBottom: 16 }]} />
                    <View style={styles.statsGrid}>
                        {[1, 2, 3].map((i) => (
                            <View key={i} style={[styles.statCard, { backgroundColor: '#E5E7EB' }]} />
                        ))}
                    </View>
                </View>

                {/* Family Section Skeleton */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <View style={[styles.skeletonText, { width: 80, height: 18, marginBottom: 16 }]} />
                    <View style={[styles.familySwitcherContainer, { backgroundColor: '#E5E7EB' }]} />
                </View>

                {/* Settings Section Skeleton */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <View style={[styles.skeletonText, { width: 70, height: 18, marginBottom: 16 }]} />
                    {[1, 2, 3, 4].map((i) => (
                        <View key={i} style={[styles.settingItem, { backgroundColor: '#E5E7EB', marginBottom: 12 }]} />
                    ))}
                </View>

                {/* Recent Activity Skeleton */}
                <View style={[styles.section, { marginTop: 24 }]}>
                    <View style={[styles.skeletonText, { width: 120, height: 18, marginBottom: 16 }]} />
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={[styles.activityCard, { backgroundColor: '#E5E7EB', marginBottom: 12 }]} />
                    ))}
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
    scrollView: {
        flex: 1,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        backgroundColor: Colors.backgroundWhite,
        marginBottom: 24,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.secondaryColor,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'Inter-Bold',
        fontSize: 32,
        color: Colors.backgroundWhite,
    },
    userName: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 24,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    userEmail: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 32,
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.borderColor,
    },
    statValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: Colors.secondaryColor,
        marginBottom: 4,
    },
    statLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 16,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    sectionTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    actionsList: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.borderColor,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderColor,
    },
    actionIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    actionSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: Colors.backgroundWhite,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    modalHeader: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderColor,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.borderColor,
        borderRadius: 2,
        marginBottom: 16,
    },
    modalTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    modalSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderColor,
    },
    languageOptionSelected: {
        backgroundColor: Colors.backgroundColor,
    },
    languageOptionContent: {
        flex: 1,
    },
    languageOptionName: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    languageOptionCode: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    modalCloseButton: {
        margin: 20,
        padding: 16,
        backgroundColor: Colors.backgroundColor,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCloseText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    // Sign Out Modal Styles
    signOutModalContent: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 24,
        margin: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    signOutIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.red + '1A',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    signOutTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    signOutMessage: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    signOutButtons: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    signOutButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.backgroundColor,
        borderWidth: 1,
        borderColor: Colors.borderColor,
    },
    confirmButton: {
        backgroundColor: Colors.red,
    },
    cancelButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    confirmButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    // Skeleton styles
    skeletonText: {
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        alignSelf: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    familySwitcherContainer: {
        height: 56,
        borderRadius: 12,
    },
    settingItem: {
        height: 56,
        borderRadius: 12,
    },
    activityCard: {
        height: 80,
        borderRadius: 12,
    },
}); 