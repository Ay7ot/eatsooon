import CustomAppBar from '@/components/ui/CustomAppBar';
import FamilySwitcher from '@/components/ui/FamilySwitcher';
import { Colors } from '@/constants/Colors';
import RecentActivity from '@/src/components/RecentActivity';
import BannerAdComponent from '@/src/components/ui/BannerAdComponent';
import { useAppInventory } from '@/src/hooks/useAppInventory';
import { FamilyMember } from '@/src/models/FamilyModel';
import { useAuth } from '@/src/services/AuthContext';
import { familyService } from '@/src/services/FamilyService';
import { notificationService } from '@/src/services/notifications/NotificationService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const LAST_NOTIFICATION_CHECK_KEY = 'last_notification_check_timestamp';
const FOREGROUND_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

type InventoryScope = 'user' | 'family';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [inventoryScope, setInventoryScope] = useState<InventoryScope>('user');
  const { stats, isLoading: isInventoryLoading } = useAppInventory(inventoryScope);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[] | null>(null);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let unsubMembers: (() => void) | null = null;

    const unsubFamilyId = familyService.listenToCurrentFamilyId((familyId) => {
      setCurrentFamilyId(familyId);

      // Clean up previous family members listener if it exists
      if (unsubMembers) {
        unsubMembers();
        unsubMembers = null;
      }

      if (!familyId) {
        // If user leaves all families, default back to their personal view
        setInventoryScope('user');
        setFamilyMembers([]);
      } else {
        // Set up new family members listener
        unsubMembers = familyService.listenToFamilyMembers(familyId, setFamilyMembers);
      }
    });

    return () => {
      unsubFamilyId();
      if (unsubMembers) {
        unsubMembers();
      }
    };
  }, [user]);


  useEffect(() => {
    // Run the check shortly after the app starts
    const timer = setTimeout(() => {
      notificationService.runForegroundUpdate();
    }, 5000); // 5-second delay to not interfere with startup tasks

    return () => clearTimeout(timer);
  }, []);


  return (
    <View style={styles.container}>
      <CustomAppBar title="Eatsooon" onSettingsPress={() => router.push('/(tabs)/profile')} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Pantry Scope Switcher */}
          <View style={styles.scopeSwitcherContainer}>
            <Pressable
              style={[styles.scopeButton, inventoryScope === 'user' && styles.scopeButtonActive]}
              onPress={() => setInventoryScope('user')}
            >
              <Text style={[styles.scopeButtonText, inventoryScope === 'user' && styles.scopeButtonTextActive]}>
                {t('home_my_pantry', 'My Pantry')}
              </Text>
            </Pressable>
            {currentFamilyId && (
              <Pressable
                style={[styles.scopeButton, inventoryScope === 'family' && styles.scopeButtonActive]}
                onPress={() => setInventoryScope('family')}
              >
                <Text style={[styles.scopeButtonText, inventoryScope === 'family' && styles.scopeButtonTextActive]}>
                  {t('home_family_pantry', 'Family Pantry')}
                </Text>
              </Pressable>
            )}
          </View>


          {isInventoryLoading ? (
            <HomeStatsSkeleton />
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statCardContent}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>{t('home_expiring_soon')}</Text>
                    <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                      <MaterialIcons name="warning" size={16} color={Colors.red} />
                    </View>
                  </View>
                  <View style={styles.statValueContainer}>
                    <Text style={[styles.statValue, { color: Colors.red }]}>{stats.expiringSoon}</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: Colors.red + '33' }]}>
                    <View style={[styles.progressFill, { backgroundColor: Colors.red, width: '30%' }]} />
                  </View>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statCardContent}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>{t('home_total_items')}</Text>
                    <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                      <MaterialIcons name="inventory" size={16} color={Colors.secondaryColor} />
                    </View>
                  </View>
                  <View style={styles.statValueContainer}>
                    <Text style={[styles.statValue, { color: Colors.secondaryColor }]}>{stats.total}</Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: Colors.secondaryColor + '33' }]}>
                    <View style={[styles.progressFill, { backgroundColor: Colors.secondaryColor, width: '70%' }]} />
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home_quick_actions')}</Text>
          <View style={styles.quickActionsContainer}>
            <Pressable style={styles.primaryAction} onPress={() => router.push('/(tabs)/scan')}>
              <MaterialIcons name="qr-code-scanner" size={20} color={Colors.backgroundWhite} />
              <Text style={styles.primaryActionText}>{t('home_scan_product')}</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction} onPress={() => router.push('/(tabs)/recipes')}>
              <MaterialIcons name="menu-book" size={20} color={Colors.textSecondary} />
              <Text style={styles.secondaryActionText}>{t('home_recipe_suggestions')}</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <RecentActivity limit={3} />
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('family_members_family_members')}</Text>
          <View style={styles.familySwitcherRow}>
            <FamilySwitcher />
            <Pressable
              onPress={() => router.push('/family-members')}
              style={styles.manageButton}>
              <Text style={styles.manageButtonText}>{t('family_manage', 'Manage')}</Text>
            </Pressable>
          </View>
          <View style={{ height: 16 }} />
          <View style={styles.familyContainer}>
            {familyMembers === null ? (
              <View style={styles.familyPlaceholder}>
                <View style={styles.familyIconContainer}>
                  <MaterialIcons name="groups" size={28} color="#9CA3AF" />
                </View>
                <Text style={styles.familyPlaceholderTitle}>{t('home_no_family_connected')}</Text>
                <Text style={styles.familyPlaceholderSubtitle}>{t('home_family_subtitle')}</Text>
                <Pressable style={styles.familyButton} onPress={() => router.push('/family-members')}>
                  <Text style={styles.familyButtonText}>{t('home_get_started')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.familyGrid}>
                {familyMembers.map((member) => (
                  <View key={member.userId} style={styles.familyMemberCard}>
                    <View
                      style={[
                        styles.familyMemberAvatar,
                        {
                          borderColor:
                            member.role === 'admin' ? Colors.red : Colors.secondaryColor,
                        },
                      ]}>
                      <Text style={styles.familyMemberAvatarText}>
                        {member.displayName?.[0]?.toUpperCase() || 'U'}
                      </Text>
                      {member.role === 'admin' && (
                        <View style={styles.adminBadge}>
                          <MaterialIcons name="star" size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.familyMemberName} numberOfLines={1}>
                      {member.displayName.split(' ')[0]}
                    </Text>
                    <View
                      style={[
                        styles.rolePill,
                        {
                          backgroundColor:
                            (member.role === 'admin' ? Colors.red : Colors.secondaryColor) + '1A',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.rolePillText,
                          { color: member.role === 'admin' ? Colors.red : Colors.secondaryColor },
                        ]}>
                        {member.role === 'admin' ? t('family_role_admin', 'Admin') : t('family_role_member', 'Member')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Banner Ad */}
        <View style={styles.bannerAdContainer}>
          <BannerAdComponent />
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 96 }} />
      </ScrollView>
    </View>
  );
}

function HomeStatsSkeleton() {
  return (
    <View style={styles.statsContainer}>
      {[1, 2].map((idx) => (
        <View key={idx} style={[styles.statCard, { backgroundColor: '#E5E7EB' }]} />
      ))}
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  bannerAdContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pantryTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  scopeSwitcherContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundColor,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.borderColor
  },
  scopeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  scopeButtonActive: {
    backgroundColor: Colors.secondaryColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scopeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scopeButtonTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.backgroundWhite,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 19.2,
  },
  statCard: {
    flex: 1,
    height: 115,
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 14.4,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: Colors.textTertiary,
    height: 16,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
    height: 29,
    lineHeight: 29,
  },
  statValueContainer: {
    height: 29,
    justifyContent: 'center',
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  quickActionsContainer: {
    gap: 12,
  },
  primaryAction: {
    backgroundColor: Colors.secondaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.2 },
    shadowOpacity: 0.05,
    shadowRadius: 2.4,
    elevation: 1,
  },
  primaryActionText: {
    color: Colors.backgroundWhite,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginLeft: 12,
    height: 19,
  },
  secondaryAction: {
    backgroundColor: Colors.backgroundWhite,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14.4,
    borderWidth: 1.2,
    borderColor: Colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.2 },
    shadowOpacity: 0.05,
    shadowRadius: 2.4,
    elevation: 1,
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    marginLeft: 12,
    height: 19,
  },
  activityContainer: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundWhite,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  activitySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textTertiary,
    marginTop: 2,
  },
  familyContainer: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  familyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  familyMemberCard: {
    width: '48%', // Adjust as needed for grid layout
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  familyMemberIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyMemberName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 2,
  },
  familyMemberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  familyMemberAvatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#6B7280',
  },
  familyMemberAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  adminBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.backgroundWhite,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rolePillText: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    textAlign: 'center',
  },
  familyPlaceholder: {
    alignItems: 'center',
  },
  familyPlaceholderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  familyPlaceholderSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  familyButton: {
    backgroundColor: Colors.secondaryColor,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  familyButtonText: {
    color: Colors.backgroundWhite,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
  },
  familyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familySwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  manageButton: {
    backgroundColor: Colors.secondaryColor,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginLeft: 12,
    minHeight: 40,
    justifyContent: 'center',
  },
  manageButtonText: {
    color: Colors.backgroundWhite,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});

