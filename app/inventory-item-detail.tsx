import CustomAppBar from '@/components/ui/CustomAppBar';
import CustomTextField from '@/components/ui/CustomTextField';
import LoadingButton from '@/components/ui/LoadingButton';
import { Colors } from '@/constants/Colors';
import { daysUntilExpiration } from '@/src/models/FoodItem';
import { inventoryService } from '@/src/services/InventoryService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

// Custom Alert Modal
interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    buttons: Array<{
        text: string;
        onPress: () => void;
        style?: 'default' | 'destructive';
    }>;
    onClose: () => void;
}

function CustomAlert({ visible, title, message, buttons, onClose }: CustomAlertProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.alertContainer}>
                    <Text style={styles.alertTitle}>{title}</Text>
                    <Text style={styles.alertMessage}>{message}</Text>
                    <View style={styles.alertButtons}>
                        {buttons.map((button, index) => (
                            <Pressable
                                key={index}
                                style={[
                                    styles.alertButton,
                                    button.style === 'destructive' && styles.alertButtonDestructive
                                ]}
                                onPress={() => {
                                    button.onPress();
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    styles.alertButtonText,
                                    button.style === 'destructive' && styles.alertButtonTextDestructive
                                ]}>
                                    {button.text}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function InventoryItemDetailScreen() {
    const { t } = useTranslation();
    const params = useLocalSearchParams<{
        itemId: string;
        itemName: string;
        itemImageUrl: string;
        itemCategory: string;
        itemQuantity: string;
        itemUnit: string;
        itemExpirationDate: string;
        familyId: string;
    }>();

    // Form state
    const [productName, setProductName] = useState(params.itemName || '');
    const [category, setCategory] = useState(params.itemCategory || '');
    const [quantity, setQuantity] = useState(params.itemQuantity || '1');
    const [unit, setUnit] = useState(params.itemUnit || '');
    const [expiryDate, setExpiryDate] = useState(
        params.itemExpirationDate ? new Date(params.itemExpirationDate) : new Date()
    );
    const [imageUrl] = useState(params.itemImageUrl || '');

    // UI state
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(expiryDate);
    const [showAlert, setShowAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' }>;
    }>({
        visible: false,
        title: '',
        message: '',
        buttons: []
    });

    // Options for dropdowns
    const categories = ['Bakery', 'Beverages', 'Dairy', 'Frozen', 'Fruits', 'Meat', 'Pantry', 'Snacks', 'Vegetables', 'Other'];
    const units = ['Liters', 'ml', 'Kg', 'Grams', 'Pieces', 'Pack(s)', 'Bottle(s)', 'Can(s)', 'lbs', 'oz'];

    const translateOption = (raw: string, type: 'cat' | 'unit' | 'store'): string => {
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
    };

    const handleBack = () => {
        router.back();
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        // Reset form to original values
        setProductName(params.itemName || '');
        setCategory(params.itemCategory || '');
        setQuantity(params.itemQuantity || '1');
        setUnit(params.itemUnit || '');
        setExpiryDate(params.itemExpirationDate ? new Date(params.itemExpirationDate) : new Date());
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!productName.trim()) {
            setShowAlert({
                visible: true,
                title: t('error'),
                message: t('product_name') + ' is required',
                buttons: [{ text: t('ok'), onPress: () => { } }]
            });
            return;
        }

        setIsLoading(true);
        try {
            const familyId = params.familyId && params.familyId.trim() !== '' ? params.familyId : null;
            await inventoryService.updateFoodItem({
                itemId: params.itemId,
                familyId: familyId,
                name: productName.trim(),
                category,
                quantity: parseFloat(quantity) || 1,
                unit,
                expirationDate: expiryDate,
                imageUrl
            });

            setShowAlert({
                visible: true,
                title: t('success'),
                message: t('item_updated_successfully'),
                buttons: [{ text: t('ok'), onPress: () => setIsEditing(false) }]
            });
        } catch (error) {
            setShowAlert({
                visible: true,
                title: t('error'),
                message: t('failed_to_update_item'),
                buttons: [{ text: t('ok'), onPress: () => { } }]
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = () => {
        setShowAlert({
            visible: true,
            title: t('confirm_delete'),
            message: t('confirm_delete_item', { name: productName }),
            buttons: [
                { text: t('cancel'), onPress: () => { } },
                { text: t('delete'), onPress: confirmDelete, style: 'destructive' }
            ]
        });
    };

    const confirmDelete = async () => {
        setIsLoading(true);
        try {
            const familyId = params.familyId && params.familyId.trim() !== '' ? params.familyId : null;
            await inventoryService.deleteFoodItem(params.itemId, familyId);
            setShowAlert({
                visible: true,
                title: t('success'),
                message: t('item_deleted_successfully'),
                buttons: [{ text: t('ok'), onPress: () => router.back() }]
            });
        } catch (error) {
            setShowAlert({
                visible: true,
                title: t('error'),
                message: t('failed_to_delete_item'),
                buttons: [{ text: t('ok'), onPress: () => { } }]
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            if (selectedDate) {
                setExpiryDate(selectedDate);
            }
        } else {
            if (selectedDate) {
                setTempDate(selectedDate);
            }
        }
    };

    const handleDateConfirm = () => {
        setExpiryDate(tempDate);
        setShowDatePicker(false);
    };

    const handleDateCancel = () => {
        setTempDate(expiryDate);
        setShowDatePicker(false);
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getEmojiForCategory = (category: string) => {
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
        if (c.includes('dairy')) return '🥛';
        if (c.includes('snack')) return '🍪';
        if (c.includes('beverage') || c.includes('drink')) return '🥤';
        if (c.includes('bakery') || c.includes('bread')) return '🍞';
        if (c.includes('frozen')) return '🧊';
        if (c.includes('pantry')) return '🥫';

        return '🥫';
    };

    const getStatusInfo = () => {
        const days = daysUntilExpiration({ expirationDate: expiryDate } as any);
        let statusText: string;
        let statusColor: string;

        if (days < 0) {
            statusText = `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
            statusColor = '#EF4444';
        } else if (days === 0) {
            statusText = 'Expires today';
            statusColor = '#F59E0B';
        } else if (days <= 3) {
            statusText = `Expires in ${days} day${days === 1 ? '' : 's'}`;
            statusColor = '#F59E0B';
        } else {
            statusText = `Expires in ${days} day${days === 1 ? '' : 's'}`;
            statusColor = '#10B981';
        }

        return { statusText, statusColor };
    };

    const { statusText, statusColor: itemStatusColor } = getStatusInfo();

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            {/* Sub-header */}
            <View style={styles.subHeader}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={Colors.textSecondary} />
                </Pressable>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('item_details')}</Text>
                    <Text style={styles.headerSubtitle}>{t('view_edit_item_details')}</Text>
                </View>
            </View>

            <CustomAlert
                visible={showAlert.visible}
                title={showAlert.title}
                message={showAlert.message}
                buttons={showAlert.buttons}
                onClose={() => setShowAlert(prev => ({ ...prev, visible: false }))}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroImageContainer}>
                        {imageUrl && imageUrl.trim() !== '' ? (
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.heroImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={styles.heroEmoji}>{getEmojiForCategory(category)}</Text>
                        )}
                    </View>
                    <View style={styles.heroContent}>
                        <Text style={styles.heroTitle}>{productName}</Text>
                        <View style={styles.heroTags}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>{quantity} {unit}</Text>
                            </View>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>{category}</Text>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: itemStatusColor + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: itemStatusColor }]} />
                            <Text style={[styles.statusText, { color: itemStatusColor }]}>{statusText}</Text>
                        </View>
                    </View>
                </View>

                {/* Information Cards */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Item Information</Text>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="label" size={20} color="#6B7280" />
                            <Text style={styles.infoLabel}>Product Name</Text>
                            <Text style={styles.infoValue}>{productName}</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="category" size={20} color="#6B7280" />
                            <Text style={styles.infoLabel}>Category</Text>
                            <Text style={styles.infoValue}>{translateOption(category, 'cat')}</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="scale" size={20} color="#6B7280" />
                            <Text style={styles.infoLabel}>Quantity</Text>
                            <Text style={styles.infoValue}>{quantity} {translateOption(unit, 'unit')}</Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <MaterialIcons name="schedule" size={20} color="#6B7280" />
                            <Text style={styles.infoLabel}>Expiry Date</Text>
                            <Text style={styles.infoValue}>{formatDate(expiryDate)}</Text>
                        </View>
                    </View>
                </View>

                {/* Edit Form (only visible when editing) */}
                {isEditing && (
                    <View style={styles.editSection}>
                        <Text style={styles.sectionTitle}>Edit Item</Text>

                        <View style={styles.editCard}>
                            <CustomTextField
                                hintText={t('product_name')}
                                controller={{ value: productName, onChangeText: setProductName }}
                            />

                            <Text style={styles.fieldLabel}>{t('category')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                                {categories.map((cat) => (
                                    <Pressable
                                        key={cat}
                                        style={[
                                            styles.optionChip,
                                            category === cat && styles.optionChipSelected
                                        ]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text style={[
                                            styles.optionChipText,
                                            category === cat && styles.optionChipTextSelected
                                        ]}>
                                            {translateOption(cat, 'cat')}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            <CustomTextField
                                hintText={t('quantity')}
                                controller={{ value: quantity, onChangeText: setQuantity }}
                                keyboardType="numeric"
                            />

                            <Text style={styles.fieldLabel}>{t('unit')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
                                {units.map((u) => (
                                    <Pressable
                                        key={u}
                                        style={[
                                            styles.optionChip,
                                            unit === u && styles.optionChipSelected
                                        ]}
                                        onPress={() => setUnit(u)}
                                    >
                                        <Text style={[
                                            styles.optionChipText,
                                            unit === u && styles.optionChipTextSelected
                                        ]}>
                                            {translateOption(u, 'unit')}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>

                            <Text style={styles.fieldLabel}>{t('expiry_date')}</Text>
                            <Pressable
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.dateButtonText}>{formatDate(expiryDate)}</Text>
                                <MaterialIcons name="date-range" size={20} color="#6B7280" />
                            </Pressable>

                            {/* DatePickerModal rendered outside */}

                            <View style={styles.editActions}>
                                <Pressable
                                    style={[styles.editActionButton, styles.cancelButton]}
                                    onPress={handleCancelEdit}
                                >
                                    <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                                </Pressable>
                                <LoadingButton
                                    title={t('save_changes')}
                                    onPress={handleSave}
                                    loading={isLoading}
                                    style={styles.saveButton}
                                />
                            </View>
                        </View>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Floating Action Buttons */}
            {!isEditing && (
                <View style={styles.fabContainer}>
                    <Pressable
                        style={[styles.fab, styles.editFab]}
                        onPress={handleEdit}
                    >
                        <MaterialIcons name="edit" size={24} color={Colors.backgroundWhite} />
                    </Pressable>
                    <Pressable
                        style={[styles.fab, styles.deleteFab]}
                        onPress={handleDelete}
                    >
                        <MaterialIcons name="delete" size={24} color={Colors.backgroundWhite} />
                    </Pressable>
                </View>
            )}

            {/* Date Picker Modal */}
            <DateTimePickerModal
                isVisible={showDatePicker}
                date={tempDate}
                mode="date"
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}
                onConfirm={(date) => {
                    setExpiryDate(date);
                    setTempDate(date);
                    setShowDatePicker(false);
                }}
                onCancel={handleDateCancel}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroSection: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 24,
        marginTop: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    heroImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    heroImage: {
        width: 120,
        height: 120,
        borderRadius: 20,
    },
    heroEmoji: {
        fontSize: 60,
    },
    heroContent: {
        alignItems: 'center',
    },
    heroTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    heroTags: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
    },
    tag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    tagText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#6B7280',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    infoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    infoCard: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
    },
    infoValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    editSection: {
        marginBottom: 24,
    },
    editCard: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    fieldLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
        marginBottom: 8,
        marginTop: 16,
    },
    optionsContainer: {
        marginBottom: 16,
    },
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    optionChipSelected: {
        backgroundColor: Colors.secondaryColor,
        borderColor: Colors.secondaryColor,
    },
    optionChipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#6B7280',
    },
    optionChipTextSelected: {
        color: Colors.backgroundWhite,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
    },
    dateButtonText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    datePickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    datePickerButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: '#6B7280',
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    editActionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingVertical: 18,
        marginTop: 0,
    },
    cancelButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: '#6B7280',
    },
    saveButton: {
        flex: 1,
        marginTop: 0,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        gap: 12,
        display: 'flex',
        flexDirection: 'row',
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    editFab: {
        backgroundColor: Colors.secondaryColor,
    },
    deleteFab: {
        backgroundColor: '#EF4444',
    },
    // Alert modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertContainer: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 24,
        marginHorizontal: 40,
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 16,
    },
    alertTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    alertMessage: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    alertButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    alertButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    alertButtonDestructive: {
        backgroundColor: '#EF4444',
    },
    alertButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    alertButtonTextDestructive: {
        color: Colors.backgroundWhite,
    },
    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        lineHeight: 22,
    },
    headerSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
}); 