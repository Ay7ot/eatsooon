import CustomAppBar from '@/components/ui/CustomAppBar';
import { Colors } from '@/constants/Colors';
import RecentActivity from '@/src/components/RecentActivity';
import { FoodItem } from '@/src/models/FoodItem';
import { useAuth } from '@/src/services/AuthContext';
import { FamilyMember, familyService } from '@/src/services/FamilyService';
import { inventoryService } from '@/src/services/InventoryService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    console.log('HomeScreen - signing out');
    await signOut();
  };

  const handleSettingsPress = () => {
    router.push('/profile');
  };

  const [items, setItems] = useState<FoodItem[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubItems = inventoryService.listenFoodItems(setItems);
    (async () => {
      const familyId = await familyService.getCurrentFamilyId();
      if (familyId) {
        const unsubFam = familyService.listenFamilyMembers(familyId, setFamilyMembers);
        return () => unsubFam();
      }
    })();
    return () => unsubItems();
  }, [user]);

  const stats = calculateStatistics(items);

  function calculateStatistics(list: FoodItem[]) {
    const today = new Date();
    const dateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayOnly = dateOnly(today);
    let expiring = 0;
    for (const item of list) {
      const days = (dateOnly(item.expirationDate).getTime() - todayOnly.getTime()) / 86400000;
      if (days > 0 && days <= 3) expiring++;
    }
    return { expiring, total: list.length };
  }

  return (
    <View style={styles.container}>
      <CustomAppBar title="Eatsooon" onSettingsPress={handleSettingsPress} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Statistics Cards */}
        <View style={[styles.section, { marginTop: 24 }]}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Expiring Soon</Text>
                  <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                    <MaterialIcons name="warning" size={16} color={Colors.red} />
                  </View>
                </View>
                <View style={styles.statValueContainer}>
                  <Text style={[styles.statValue, { color: Colors.red }]}>{stats.expiring}</Text>
                </View>
                <View style={[styles.progressBar, { backgroundColor: Colors.red + '33' }]}>
                  <View style={[styles.progressFill, { backgroundColor: Colors.red, width: '30%' }]} />
                </View>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Total Items</Text>
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
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <Pressable style={styles.primaryAction} onPress={() => router.push('/scan')}>
              <MaterialIcons name="qr-code-scanner" size={20} color={Colors.backgroundWhite} />
              <Text style={styles.primaryActionText}>Scan Product</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction} onPress={() => router.push('/recipes')}>
              <MaterialIcons name="menu-book" size={20} color={Colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Recipe Suggestions</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <RecentActivity limit={3} />
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          <View style={styles.familyContainer}>
            {familyMembers.length === 0 ? (
              <View style={styles.familyPlaceholder}>
                <View style={styles.familyIconContainer}>
                  <MaterialIcons name="groups" size={28} color="#9CA3AF" />
                </View>
                <Text style={styles.familyPlaceholderTitle}>No family connected</Text>
                <Text style={styles.familyPlaceholderSubtitle}>Connect with family to share your pantry</Text>
                <Pressable style={styles.familyButton}>
                  <Text style={styles.familyButtonText}>Get Started</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.familyGrid}>
                {familyMembers.map((member, index) => (
                  <View key={index} style={styles.familyMemberCard}>
                    <View style={styles.familyMemberIconContainer}>
                      <MaterialIcons name="person" size={24} color="#4B5563" />
                    </View>
                    <Text style={styles.familyMemberName}>{member.displayName}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 96 }} />
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyMemberName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
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
});

