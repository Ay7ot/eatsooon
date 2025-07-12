import { Colors } from '@/constants/Colors';
import { useAuth } from '@/src/services/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('HomeScreen - signing out');
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.displayName || user?.email?.split('@')[0] || 'User'}</Text>
          </View>
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={20} color={Colors.backgroundWhite} />
          </Pressable>
        </View>

        {/* Statistics Cards */}
        <View style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Expiring Soon</Text>
                  <View style={[styles.statIcon, { backgroundColor: Colors.red + '20' }]}>
                    <MaterialIcons name="warning" size={16} color={Colors.red} />
                  </View>
                </View>
                <Text style={[styles.statValue, { color: Colors.red }]}>3</Text>
                <View style={[styles.progressBar, { backgroundColor: Colors.red + '20' }]}>
                  <View style={[styles.progressFill, { backgroundColor: Colors.red, width: '30%' }]} />
                </View>
              </View>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statCardContent}>
                <View style={styles.statHeader}>
                  <Text style={styles.statLabel}>Total Items</Text>
                  <View style={[styles.statIcon, { backgroundColor: Colors.green + '20' }]}>
                    <MaterialIcons name="inventory" size={16} color={Colors.green} />
                  </View>
                </View>
                <Text style={[styles.statValue, { color: Colors.green }]}>24</Text>
                <View style={[styles.progressBar, { backgroundColor: Colors.green + '20' }]}>
                  <View style={[styles.progressFill, { backgroundColor: Colors.green, width: '70%' }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <Pressable style={styles.primaryAction}>
              <MaterialIcons name="qr-code-scanner" size={20} color={Colors.backgroundWhite} />
              <Text style={styles.primaryActionText}>Scan Product</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction}>
              <MaterialIcons name="menu-book" size={20} color={Colors.textSecondary} />
              <Text style={styles.secondaryActionText}>Recipe Suggestions</Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityContainer}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: Colors.green + '20' }]}>
                <MaterialIcons name="add" size={16} color={Colors.green} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Added Milk</Text>
                <Text style={styles.activitySubtitle}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: Colors.orange + '20' }]}>
                <MaterialIcons name="warning" size={16} color={Colors.orange} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Bread expires tomorrow</Text>
                <Text style={styles.activitySubtitle}>4 hours ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          <View style={styles.familyContainer}>
            <View style={styles.familyPlaceholder}>
              <MaterialIcons name="groups" size={32} color={Colors.textTertiary} />
              <Text style={styles.familyPlaceholderTitle}>No family connected</Text>
              <Text style={styles.familyPlaceholderSubtitle}>Connect with family to share your pantry</Text>
              <Pressable style={styles.familyButton}>
                <Text style={styles.familyButtonText}>Get Started</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textTertiary,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Nunito-SemiBold',
    color: Colors.textPrimary,
  },
  signOutButton: {
    backgroundColor: Colors.red,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
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
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 14,
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
    height: 83,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: Colors.textTertiary,
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
    marginBottom: 8,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  quickActionsContainer: {
    gap: 12,
  },
  primaryAction: {
    backgroundColor: Colors.green,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryActionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.backgroundWhite,
  },
  secondaryAction: {
    backgroundColor: Colors.backgroundWhite,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryActionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textSecondary,
  },
  activityContainer: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.textPrimary,
  },
  activitySubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.textTertiary,
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
  familyPlaceholder: {
    alignItems: 'center',
  },
  familyPlaceholderTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  familyPlaceholderSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  familyButton: {
    backgroundColor: Colors.green,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  familyButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: Colors.backgroundWhite,
  },
});
