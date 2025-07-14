import CustomAppBar from '@/components/ui/CustomAppBar';
import { Colors } from '@/constants/Colors';
import { useAppInventory } from '@/src/hooks/useAppInventory';
import { daysUntilExpiration, FoodItem, statusColor } from '@/src/models/FoodItem';
import { useAuth } from '@/src/services/AuthContext';
import { familyService } from '@/src/services/FamilyService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

type InventoryScope = 'user' | 'family';
type FilterKey = 'all' | 'soon' | 'today' | 'expired';

// Map FilterKey -> translation key
const FILTER_LABEL_KEYS: Record<FilterKey, string> = {
    all: 'inventory_tab_all',
    soon: 'inventory_tab_expiring_soon',
    today: 'inventory_tab_expires_today',
    expired: 'inventory_tab_expired',
};

export default function InventoryScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [inventoryScope, setInventoryScope] = useState<InventoryScope>('family');
    const { items, stats, isLoading } = useAppInventory(inventoryScope);
    const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);

    // UI state
    const [selectedFilter, setSelectedFilter] = useState<FilterKey>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!user) return;
        const unsubFamilyId = familyService.listenToCurrentFamilyId((familyId) => {
            setCurrentFamilyId(familyId);
            if (!familyId) {
                setInventoryScope('user');
            }
        });
        return () => unsubFamilyId();
    }, [user]);

    const filteredItems = useMemo(() => {
        let list = [...items];

        // Search filter
        if (searchQuery.trim()) {
            list = list.filter((it) =>
                it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (it.category ?? '').toLowerCase().includes(searchQuery.toLowerCase()),
            );
        }

        // Status filter
        switch (selectedFilter) {
            case 'soon':
                list = list.filter((it) => {
                    const diff = daysUntilExpiration(it);
                    return diff > 0 && diff <= 3;
                });
                break;
            case 'today':
                list = list.filter((it) => daysUntilExpiration(it) === 0);
                break;
            case 'expired':
                list = list.filter((it) => daysUntilExpiration(it) < 0);
                break;
            case 'all':
            default:
                break;
        }

        // Sort by expiration date asc
        list.sort((a, b) => a.expirationDate.getTime() - b.expirationDate.getTime());

        return list;
    }, [items, selectedFilter, searchQuery]);


    // --- RENDERERS --- //

    const renderItem = ({ item }: { item: FoodItem }) => <InventoryItemCard item={item} />;

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            {isLoading ? (
                <InventorySkeleton />
            ) : (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {/* Pantry Scope Switcher */}
                    <View style={[styles.section, { marginTop: 24, marginBottom: 0 }]}>
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
                    </View>

                    {/* Statistics */}
                    <View style={[styles.section, { marginTop: 24 }]}>
                        <StatisticsCards stats={stats} />
                    </View>

                    {/* Filters */}
                    <View style={[styles.section, { marginTop: 8 }]}>
                        <FilterTabs selected={selectedFilter} onSelect={setSelectedFilter} />
                    </View>

                    {/* Search */}
                    <View style={[styles.section, { marginTop: 8 }]}>
                        <SearchBar value={searchQuery} onChange={setSearchQuery} />
                    </View>

                    {/* Results */}
                    <View style={styles.section}>
                        {filteredItems.length === 0 ? (
                            <Text style={styles.noResultText}>{t('inventory_no_items_found')}</Text>
                        ) : (
                            <FlatList
                                data={filteredItems}
                                keyExtractor={(item) => item.id}
                                renderItem={renderItem}
                                scrollEnabled={false}
                                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                            />
                        )}
                    </View>

                    {/* bottom padding */}
                    <View style={{ height: 80 }} />
                </ScrollView>
            )}
        </View>
    );
}

// -------------------- SUB COMPONENTS -------------------- //

function StatisticsCards({ stats }: { stats: { expiringSoon: number; expiringToday: number; total: number, expired: number } }) {
    const { t } = useTranslation();
    return (
        <View style={styles.statsContainer}>
            <StatCard
                label={t('inventory_expiring')}
                value={stats.expiringSoon}
                icon="warning"
                color={Colors.red}
                bgColor="#FEE2E2"
            />
            <StatCard
                label={t('inventory_today')}
                value={stats.expiringToday}
                icon="schedule"
                color="#F59E0B"
                bgColor="#FEF3C7"
            />
            <StatCard
                label={t('inventory_total')}
                value={stats.total}
                icon="inventory"
                color={Colors.secondaryColor}
                bgColor="#D1FAE5"
            />
        </View>
    );
}

function StatCard({ label, value, icon, color, bgColor }: { label: string; value: number; icon: any; color: string; bgColor: string }) {
    return (
        <View style={styles.statCard}>
            <View style={styles.statCardContent}>
                <Text style={styles.statLabel}>{label}</Text>
                <Text style={[styles.statValue, { color }]}>{value}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: color }]} />
        </View>
    );
}

function FilterTabs({ selected, onSelect }: { selected: FilterKey; onSelect: (f: FilterKey) => void }) {
    const { t } = useTranslation();
    const filters: FilterKey[] = ['all', 'soon', 'today', 'expired'];
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((f) => {
                const isActive = selected === f;
                return (
                    <Pressable
                        key={f}
                        onPress={() => onSelect(f)}
                        style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
                    >
                        <Text style={[styles.filterChipText, isActive ? { color: Colors.backgroundWhite } : null]}>{t(FILTER_LABEL_KEYS[f])}</Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const { t } = useTranslation();
    return (
        <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
                placeholder={t('inventory_search_hint')}
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={value}
                onChangeText={onChange}
            />
            {value.length > 0 && (
                <Pressable onPress={() => onChange('')}>
                    <MaterialIcons name="close" size={20} color="#9CA3AF" />
                </Pressable>
            )}
        </View>
    );
}

function InventoryItemCard({ item }: { item: FoodItem }) {
    const { t } = useTranslation();
    // Determine badge
    const days = daysUntilExpiration(item);
    let badgeLabel: string;
    let badgeBg: string;
    let badgeText: string;
    if (days < 0) {
        badgeLabel = t('inventory_status_expired');
        badgeBg = '#FEE2E2';
        badgeText = '#7F1D1D';
    } else if (days === 0) {
        badgeLabel = t('inventory_status_today');
        badgeBg = '#FEE2E2';
        badgeText = '#991B1B';
    } else if (days === 1) {
        badgeLabel = t('inventory_status_urgent');
        badgeBg = '#FEE2E2';
        badgeText = '#991B1B';
    } else if (days <= 3) {
        badgeLabel = t('inventory_status_soon');
        badgeBg = '#FEF3C7';
        badgeText = '#92400E';
    } else {
        badgeLabel = t('inventory_status_fresh');
        badgeBg = '#D1FAE5';
        badgeText = '#065F46';
    }

    const emoji = getEmojiForCategory(item.category);

    const handleItemPress = () => {
        router.push({
            pathname: '/inventory-item-detail',
            params: {
                itemId: item.id,
                itemName: item.name,
                itemImageUrl: item.imageUrl || '',
                itemCategory: item.category,
                itemQuantity: item.quantity?.toString() || '1',
                itemUnit: item.unit || '',
                itemExpirationDate: item.expirationDate.toISOString(),
            },
        });
    };

    return (
        <Pressable onPress={handleItemPress}>
            <View style={[styles.itemCard, { borderLeftColor: statusColor(item) }]}>
                {/* Image / Emoji */}
                <View style={styles.itemImageContainer}>
                    {item.imageUrl && item.imageUrl.trim() !== '' ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.itemImage}
                            resizeMode="cover"
                            onError={() => {
                                // Fallback to emoji if image fails to load
                                console.log('Failed to load image:', item.imageUrl);
                            }}
                        />
                    ) : (
                        <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    )}
                </View>

                {/* Details */}
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>{`${item.quantity ?? 1} ${translateOption(item.unit ?? '', 'unit', t)} • ${translateOption(item.category, 'cat', t)}`}</Text>
                    <Text style={[styles.itemSub, { color: statusColor(item) }]}>
                        {days < 0
                            ? t('inventory_expired_ago', { count: Math.abs(days) })
                            : days === 0
                                ? t('inventory_expires_today')
                                : t('inventory_expires_in', { count: days })}
                    </Text>
                </View>

                {/* Badge */}
                <View style={[styles.badgeContainer, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.badgeText, { color: badgeText }]}>{badgeLabel}</Text>
                </View>
            </View>
        </Pressable>
    );
}

function InventorySkeleton() {
    // Very simple skeleton using grey boxes
    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <View style={styles.statsContainer}>
                    {[1, 2, 3].map((i) => (
                        <View key={i} style={[styles.statCard, { backgroundColor: '#E5E7EB' }]} />
                    ))}
                </View>
            </View>
            <View style={[styles.section, { flexDirection: 'row' }]}>
                {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={[styles.filterChip, { backgroundColor: '#E5E7EB', marginRight: 12 }]} />
                ))}
            </View>
            <View style={styles.section}>
                <View style={[styles.searchContainer, { backgroundColor: '#E5E7EB' }]} />
            </View>
            <View style={styles.section}>
                {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={[styles.itemCard, { backgroundColor: '#E5E7EB', borderLeftColor: '#E5E7EB', marginBottom: 16 }]} />
                ))}
            </View>
        </ScrollView>
    );
}

// -------------------- UTILS -------------------- //

function translateOption(raw: string, type: 'cat' | 'unit' | 'store', t: any) {
    // Create a mapping for each type
    const categoryMap: { [key: string]: string } = {
        'bakery': 'cat_bakery',
        'beverages': 'cat_beverages',
        'dairy': 'cat_dairy',
        'frozen': 'cat_frozen',
        'fruits': 'cat_fruits',
        'meat': 'cat_meat',
        'pantry': 'cat_pantry',
        'snacks': 'cat_snacks',
        'vegetables': 'cat_vegetables',
        'other': 'cat_other',
    };

    const unitMap: { [key: string]: string } = {
        'liters': 'unit_liters',
        'ml': 'unit_ml',
        'kg': 'unit_kg',
        'grams': 'unit_grams',
        'pieces': 'unit_pieces',
        'pcs': 'unit_pcs',
        'pack(s)': 'unit_packs',
        'packs': 'unit_packs',
        'bottle(s)': 'unit_bottles',
        'bottles': 'unit_bottles',
        'can(s)': 'unit_cans',
        'cans': 'unit_cans',
        'lbs': 'unit_lbs',
        'oz': 'unit_oz',
    };

    const storeMap: { [key: string]: string } = {
        'refrigerator': 'store_refrigerator',
        'freezer': 'store_freezer',
        'pantry': 'store_pantry',
        'counter': 'store_counter',
    };

    const slug = raw.toLowerCase().replace(/[^a-z()]/g, '');
    let key = '';

    switch (type) {
        case 'cat':
            key = categoryMap[slug] || `cat_${slug}`;
            break;
        case 'unit':
            key = unitMap[slug] || `unit_${slug}`;
            break;
        case 'store':
            key = storeMap[slug] || `store_${slug}`;
            break;
    }

    const translated = t(key);
    return translated !== key ? translated : raw;
}

function getEmojiForCategory(category: string) {
    const c = category.toLowerCase();

    // Exact category matches first
    if (c === 'bakery') return '🍞';
    if (c === 'beverages') return '🥤';
    if (c === 'dairy') return '🥛';
    if (c === 'frozen') return '🧊';
    if (c === 'fruits') return '🍎';
    if (c === 'meat') return '🍗';
    if (c === 'pantry') return '🥫';
    if (c === 'snacks') return '🍪';
    if (c === 'vegetables') return '🥬';
    if (c === 'other') return '📦';

    // Fallback partial matches for backwards compatibility
    if (c.includes('fruit')) return '🍎';
    if (c.includes('vegetable')) return '🥬';
    if (c.includes('meat')) return '🍗';
    if (c.includes('dairy') || c.includes('milk')) return '🥛';
    if (c.includes('snack')) return '🍪';
    if (c.includes('drink') || c.includes('beverage')) return '🥤';
    if (c.includes('bakery') || c.includes('bread')) return '🍞';
    if (c.includes('frozen')) return '🧊';
    if (c.includes('pantry')) return '🥫';

    return '🥫';
}

// -------------------- STYLES -------------------- //

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    scopeSwitcherContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: Colors.backgroundColor,
        borderRadius: 12,
        padding: 4,
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
    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        height: 115,
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 14.4,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        justifyContent: 'space-between',
    },
    statLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textTertiary,
        marginBottom: 4,
        textAlign: 'center',
    },
    statValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        textAlign: 'center',
    },
    progressBar: {
        height: 4,
        borderRadius: 3,
        width: '100%',
    },
    statCardContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Filter chips
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        marginRight: 12,
    },
    filterChipActive: {
        backgroundColor: Colors.secondaryColor,
        borderColor: Colors.secondaryColor,
    },
    filterChipText: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 14.4,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    // Item card
    itemCard: {
        flexDirection: 'row',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 14.4,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        padding: 16,
        borderLeftWidth: 4,
    },
    itemImageContainer: {
        width: 56,
        height: 56,
        borderRadius: 9.6,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.borderColor,
        overflow: 'hidden',
    },
    itemImage: {
        width: 56,
        height: 56,
        borderRadius: 9.6,
    },
    itemImageWrapper: {
        width: 56,
        height: 56,
        borderRadius: 9.6,
        overflow: 'hidden',
    },
    itemName: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    itemSub: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 2,
    },
    badgeContainer: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
    },
    noResultText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textTertiary,
        textAlign: 'center',
        marginTop: 40,
    },
});