import CustomAppBar from '@/components/ui/CustomAppBar';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/src/services/AuthContext';
import { expiryNotificationService } from '@/src/services/ExpiryNotificationService';
import { familyService } from '@/src/services/FamilyService';
import { inventoryService } from '@/src/services/InventoryService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { isValid, parse } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const tryParseExpiryDate = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null;

    const formats = [
        "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
        'yyyy-MM-dd',
        'dd-MM-yyyy',
        'MM/dd/yyyy',
        'dd/MM/yyyy',
        'yyyy/MM/dd',
        'dd MMM yyyy',
        'MMM dd, yyyy',
    ];

    for (const format of formats) {
        try {
            const parsedDate = parse(dateString, format, new Date());
            if (isValid(parsedDate)) {
                return parsedDate;
            }
        } catch (error) {
            // Ignore parsing errors and try the next format
        }
    }

    return null;
};

// Custom Modal Component
interface CustomModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function CustomModal({ visible, onClose, title, children }: CustomModalProps) {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <Pressable onPress={onClose} style={styles.modalCloseButton}>
                            <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
                        </Pressable>
                    </View>
                    <View style={styles.modalContent}>
                        {children}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

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

export default function ProductConfirmationScreen() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const params = useLocalSearchParams();

    // Extract parameters
    const detectedProductName = (params.detectedProductName as string) || '';
    const detectedExpiryDate = (params.detectedExpiryDate as string) || '';
    const productImageUrl = (params.productImageUrl as string) || '';
    const detectedBarcode = (params.detectedBarcode as string) || '';

    // Form state - Use empty values instead of defaults
    const [productName, setProductName] = useState(detectedProductName);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [notes, setNotes] = useState('');
    // Use a special date to indicate "no date set" - far future date that we can check for
    const NO_DATE_SET = new Date(2099, 11, 31);

    const [expiryDate, setExpiryDate] = useState<Date>(() => {
        if (detectedExpiryDate) {
            const parsed = tryParseExpiryDate(detectedExpiryDate);
            if (parsed) return parsed;
        }
        return NO_DATE_SET; // Special value indicating no date was detected
    });

    // Modal states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showUnitPicker, setShowUnitPicker] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showPantryChoice, setShowPantryChoice] = useState(false);
    const [showAlert, setShowAlert] = useState<{
        visible: boolean;
        title: string;
        message: string;
        buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'destructive' }>;
    }>({ visible: false, title: '', message: '', buttons: [] });

    // Temporary date state for picker
    const [tempDate, setTempDate] = useState<Date>(expiryDate);

    const [isLoading, setIsLoading] = useState(false);
    const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Dropdown options
    const categories = ['Bakery', 'Beverages', 'Dairy', 'Frozen', 'Fruits', 'Meat', 'Pantry', 'Snacks', 'Vegetables', 'Other'];
    const units = ['Liters', 'ml', 'Kg', 'Grams', 'Pieces', 'Pack(s)', 'Bottle(s)', 'Can(s)', 'lbs', 'oz'];
    const locations = ['Refrigerator', 'Freezer', 'Pantry', 'Counter'];

    useEffect(() => {
        const unsub = familyService.listenToCurrentFamilyId(setCurrentFamilyId);
        return () => unsub();
    }, []);

    const handleSettingsPress = () => {
        router.push('/(tabs)/profile');
    };

    const handleBack = () => {
        router.back();
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!productName.trim()) {
            newErrors.productName = t('confirm_name_required');
        } else if (productName.trim().length < 2) {
            newErrors.productName = t('confirm_name_short');
        }

        // Only validate quantity if it's provided
        if (quantity.trim()) {
            const qty = parseFloat(quantity);
            if (isNaN(qty) || qty <= 0) {
                newErrors.quantity = t('confirm_quantity_invalid');
            }
        }

        if (expiryDate.getTime() === NO_DATE_SET.getTime()) {
            newErrors.expiryDate = t('confirm_expiry_required');
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expiryDate < today) {
                newErrors.expiryDate = t('confirm_expiry_past');
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddToInventory = async () => {
        if (!validateForm()) return;
        if (currentFamilyId) {
            setShowPantryChoice(true);
        } else {
            // No family, add to personal pantry directly
            await addItemToPantry();
        }
    };

    const addItemToPantry = async (scope: 'user' | 'family' = 'user') => {
        setShowPantryChoice(false);
        setIsLoading(true);
        try {
            const qtyNum = quantity.trim() ? parseFloat(quantity) : 1;
            const familyId = scope === 'family' ? currentFamilyId : null;

            const itemId = await inventoryService.addFoodItem({
                name: productName.trim(),
                expirationDate: expiryDate,
                category: selectedCategory || 'other',
                quantity: qtyNum,
                unit: selectedUnit || 'pieces',
                imageUrl: productImageUrl || undefined,
                familyId: familyId,
            });

            console.log(`✅ Item added to ${scope} pantry with ID: ${itemId}`);

            // Trigger expiry notification check after adding item
            await expiryNotificationService.scheduleNotificationsForNewItem({
                id: itemId,
                name: productName.trim(),
                expirationDate: expiryDate,
                category: selectedCategory || 'other',
                quantity: parseFloat(quantity) || 1,
                unit: selectedUnit || 'pieces',
                imageUrl: productImageUrl || '',
            });

            setShowAlert({
                visible: true,
                title: t('confirm_success_title'),
                message: t('confirm_item_added', { name: productName }),
                buttons: [
                    {
                        text: t('confirm_view_inventory'),
                        onPress: () => router.push('/(tabs)/inventory'),
                    },
                ]
            });
        } catch (error) {
            console.error('❌ Error adding item to pantry:', error);
            setShowAlert({
                visible: true,
                title: t('confirm_error_title'),
                message: t('confirm_add_failed', { error: String(error) }),
                buttons: [{ text: t('scan_ok'), onPress: () => { } }]
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateForDisplay = (date: Date): string => {
        if (date.getTime() === NO_DATE_SET.getTime()) {
            return t('field_select_date_placeholder');
        }
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

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

    const handleDatePickerOpen = () => {
        // If no date is set (using the special NO_DATE_SET value), start with today's date
        if (expiryDate.getTime() === NO_DATE_SET.getTime()) {
            setTempDate(new Date());
        } else {
            setTempDate(expiryDate);
        }
        setShowDatePicker(true);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        const type = event?.type ?? 'set';
        if (type === 'dismissed') {
            setShowDatePicker(false);
            return;
        }

        if (Platform.OS === 'android') {
            if (selectedDate) {
                setExpiryDate(selectedDate);
            }
            setShowDatePicker(false);
        } else if (selectedDate) {
            setTempDate(selectedDate);
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

    // Handlers that clear errors when selections are made
    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        // Clear category error when user selects a category
        if (errors.category) {
            setErrors(prev => {
                const { category, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleUnitSelect = (unit: string) => {
        setSelectedUnit(unit);
        // Clear unit error when user selects a unit
        if (errors.unit) {
            setErrors(prev => {
                const { unit, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleLocationSelect = (location: string) => {
        setSelectedLocation(location);
        // Clear storage location error when user selects a location
        if (errors.location) {
            setErrors(prev => {
                const { location, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleProductNameChange = (text: string) => {
        setProductName(text);
        // Clear product name error when user types
        if (errors.productName) {
            setErrors(prev => {
                const { productName, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleQuantityChange = (text: string) => {
        setQuantity(text);
        // Clear quantity error when user types
        if (errors.quantity) {
            setErrors(prev => {
                const { quantity, ...rest } = prev;
                return rest;
            });
        }
    };

    const renderProductImage = () => {
        if (productImageUrl) {
            return (
                <Image
                    source={{ uri: productImageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
            );
        }
        return (
            <View style={styles.productImagePlaceholder}>
                <MaterialIcons name="inventory-2" size={32} color={Colors.textTertiary} />
            </View>
        );
    };

    const renderOptionsList = (
        options: string[],
        selectedValue: string,
        onSelect: (value: string) => void,
        onClose: () => void,
        type: 'cat' | 'unit' | 'store'
    ) => (
        <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {options.map((option) => (
                <Pressable
                    key={option}
                    style={[
                        styles.optionItem,
                        selectedValue === option && styles.optionItemSelected
                    ]}
                    onPress={() => {
                        onSelect(option);
                        onClose();
                    }}
                >
                    <Text style={[
                        styles.optionText,
                        selectedValue === option && styles.optionTextSelected
                    ]}>
                        {translateOption(option, type)}
                    </Text>
                    {selectedValue === option && (
                        <MaterialIcons name="check" size={20} color={Colors.secondaryColor} />
                    )}
                </Pressable>
            ))}
        </ScrollView>
    );

    const hasDetectedData = Boolean(detectedProductName || detectedExpiryDate);

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" onSettingsPress={handleSettingsPress} />

            {/* Sub-header */}
            <View style={styles.subHeader}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={Colors.textSecondary} />
                </Pressable>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>{t('confirm_title')}</Text>
                    <Text style={styles.headerSubtitle}>{t('confirm_subtitle')}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Success Banner */}
                <View style={styles.successBanner}>
                    <View style={styles.successIcon}>
                        <MaterialIcons name="check-circle" size={24} color="#FFFFFF" />
                    </View>
                    <View style={styles.successContent}>
                        <Text style={styles.successTitle}>
                            {hasDetectedData ? t('confirm_detected') : t('confirm_manual_mode')}
                        </Text>
                        <Text style={styles.successSubtitle}>
                            {hasDetectedData ? t('confirm_review_details') : t('confirm_enter_manually')}
                        </Text>
                    </View>
                </View>

                {/* Main Product Card */}
                <View style={styles.productCard}>
                    {/* Product Header */}
                    <View style={styles.productHeader}>
                        <View style={styles.productImageContainer}>
                            {renderProductImage()}
                        </View>
                        <View style={styles.productHeaderContent}>
                            <Text style={styles.productCardTitle}>{t('confirm_product_details_header')}</Text>
                            <Text style={styles.productCardSubtitle}>{t('confirm_review_edit_info')}</Text>

                            {hasDetectedData && (
                                <View style={styles.aiDetectedBadge}>
                                    <MaterialIcons name="auto-awesome" size={14} color={Colors.secondaryColor} />
                                    <Text style={styles.aiDetectedText}>{t('confirm_ai_detected_fields')}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formSection}>
                        {/* Product Name */}
                        <View style={styles.formField}>
                            <View style={styles.fieldHeader}>
                                <Text style={styles.fieldLabel}>{t('field_product_name')} *</Text>
                                {detectedProductName && (
                                    <View style={styles.detectedBadge}>
                                        <Text style={styles.detectedBadgeText}>AI-detected</Text>
                                    </View>
                                )}
                            </View>
                            <View style={[styles.inputContainer, errors.productName && styles.inputError]}>
                                <MaterialIcons name="shopping-bag" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    value={productName}
                                    onChangeText={handleProductNameChange}
                                    placeholder={t('field_product_name_placeholder')}
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>
                            {errors.productName && <Text style={styles.errorText}>{errors.productName}</Text>}
                        </View>

                        {/* Expiry Date */}
                        <View style={styles.formField}>
                            <View style={styles.fieldHeader}>
                                <Text style={styles.fieldLabel}>{t('field_expiry_date')} *</Text>
                                {detectedExpiryDate && (
                                    <View style={styles.detectedBadge}>
                                        <Text style={styles.detectedBadgeText}>AI-detected</Text>
                                    </View>
                                )}
                            </View>
                            <Pressable
                                style={[styles.inputContainer, errors.expiryDate && styles.inputError]}
                                onPress={handleDatePickerOpen}
                            >
                                <MaterialIcons name="calendar-today" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                                <Text style={styles.dateText}>{formatDateForDisplay(expiryDate)}</Text>
                                <MaterialIcons name="edit-calendar" size={20} color={Colors.textTertiary} />
                            </Pressable>
                            {errors.expiryDate && <Text style={styles.errorText}>{errors.expiryDate}</Text>}
                        </View>

                        {/* Category and Quantity Row */}
                        <View style={styles.formRow}>
                            <View style={[styles.formField, { flex: 1 }]}>
                                <Text style={styles.fieldLabel}>{t('field_category')}</Text>
                                <Pressable
                                    style={[styles.inputContainer, errors.category && styles.inputError]}
                                    onPress={() => setShowCategoryPicker(true)}
                                >
                                    <MaterialIcons name="category" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                                    <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
                                        {selectedCategory ? translateOption(selectedCategory, 'cat') : ''}
                                    </Text>
                                    <MaterialIcons name="expand-more" size={20} color={Colors.textTertiary} />
                                </Pressable>
                                {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
                            </View>

                            <View style={styles.formRowSpacer} />

                            <View style={[styles.formField, { flex: 1 }]}>
                                <Text style={styles.fieldLabel}>{t('field_quantity')}</Text>
                                <View style={[styles.inputContainer, errors.quantity && styles.inputError]}>
                                    <MaterialIcons name="numbers" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.textInput}
                                        value={quantity}
                                        onChangeText={handleQuantityChange}
                                        placeholder={t('field_quantity_placeholder')}
                                        placeholderTextColor={Colors.textTertiary}
                                        keyboardType="numeric"
                                    />
                                </View>
                                {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
                            </View>
                        </View>

                        {/* Unit and Storage Row */}
                        <View style={styles.formRow}>
                            <View style={[styles.formField, { flex: 1 }]}>
                                <Text style={styles.fieldLabel}>{t('field_unit')}</Text>
                                <Pressable
                                    style={[styles.inputContainer, errors.unit && styles.inputError]}
                                    onPress={() => setShowUnitPicker(true)}
                                >
                                    <MaterialIcons name="straighten" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                                    <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
                                        {selectedUnit ? translateOption(selectedUnit, 'unit') : ''}
                                    </Text>
                                    <MaterialIcons name="expand-more" size={20} color={Colors.textTertiary} />
                                </Pressable>
                                {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}
                            </View>

                            <View style={styles.formRowSpacer} />

                            <View style={[styles.formField, { flex: 1 }]}>
                                <Text style={styles.fieldLabel}>{t('field_storage')}</Text>
                                <Pressable
                                    style={[styles.inputContainer, errors.location && styles.inputError]}
                                    onPress={() => setShowLocationPicker(true)}
                                >
                                    <MaterialIcons name="kitchen" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                                    <Text style={styles.dateText} numberOfLines={1} ellipsizeMode="tail">
                                        {selectedLocation ? translateOption(selectedLocation, 'store') : ''}
                                    </Text>
                                    <MaterialIcons name="expand-more" size={20} color={Colors.textTertiary} />
                                </Pressable>
                                {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
                            </View>
                        </View>

                        {/* Notes */}
                        <View style={styles.formField}>
                            <Text style={styles.fieldLabel}>{t('field_notes_optional')}</Text>
                            <View style={styles.inputContainer}>
                                <MaterialIcons name="note" size={20} color={Colors.textTertiary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.textInput, styles.textInputMultiline]}
                                    value={notes}
                                    onChangeText={setNotes}
                                    placeholder={t('field_notes_placeholder')}
                                    placeholderTextColor={Colors.textTertiary}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <Pressable
                        style={[styles.addButton, isLoading && styles.addButtonDisabled]}
                        onPress={handleAddToInventory}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <MaterialIcons name="hourglass-empty" size={22} color="#FFFFFF" />
                        ) : (
                            <MaterialIcons name="add-circle-outline" size={22} color="#FFFFFF" />
                        )}
                        <Text style={styles.addButtonText}>{t('confirm_add_pantry_button')}</Text>
                    </Pressable>

                    <Pressable style={styles.scanAgainButton} onPress={handleBack}>
                        <MaterialIcons name="camera-alt" size={22} color={Colors.textSecondary} />
                        <Text style={styles.scanAgainText}>{t('confirm_scan_again')}</Text>
                    </Pressable>
                </View>
            </ScrollView>

            {/* Custom Modals */}

            {/* Date Picker Modal */}
            <DateTimePickerModal
                isVisible={showDatePicker}
                date={tempDate}
                mode="date"
                minimumDate={new Date()}
                maximumDate={new Date(2099, 11, 31)}
                onConfirm={(date) => {
                    setExpiryDate(date);
                    setTempDate(date);
                    setShowDatePicker(false);
                    // Clear expiry date error when user selects a date
                    if (errors.expiryDate) {
                        setErrors(prev => {
                            const { expiryDate, ...rest } = prev;
                            return rest;
                        });
                    }
                }}
                onCancel={handleDateCancel}
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
            />

            {/* Category Picker Modal */}
            <CustomModal
                visible={showCategoryPicker}
                onClose={() => setShowCategoryPicker(false)}
                title={t('field_category')}
            >
                {renderOptionsList(categories, selectedCategory, handleCategorySelect, () => setShowCategoryPicker(false), 'cat')}
            </CustomModal>

            {/* Unit Picker Modal */}
            <CustomModal
                visible={showUnitPicker}
                onClose={() => setShowUnitPicker(false)}
                title={t('field_unit')}
            >
                {renderOptionsList(units, selectedUnit, handleUnitSelect, () => setShowUnitPicker(false), 'unit')}
            </CustomModal>

            {/* Location Picker Modal */}
            <CustomModal
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                title={t('field_storage')}
            >
                {renderOptionsList(locations, selectedLocation, handleLocationSelect, () => setShowLocationPicker(false), 'store')}
            </CustomModal>

            {/* Pantry Choice Modal */}
            <CustomModal
                visible={showPantryChoice}
                onClose={() => setShowPantryChoice(false)}
                title={t('confirm_pantry_choice_title')}
            >
                <View style={styles.pantryChoiceContent}>
                    <Text style={styles.pantryChoiceMessage}>
                        {t('confirm_pantry_choice_message', { name: productName })}
                    </Text>
                    <View style={styles.pantryChoiceButtons}>
                        <Pressable
                            style={[styles.pantryChoiceButton, styles.pantryChoiceButtonPrimary]}
                            onPress={() => addItemToPantry('user')}
                        >
                            <Text style={styles.pantryChoiceButtonText}>{t('confirm_pantry_choice_personal')}</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.pantryChoiceButton, styles.pantryChoiceButtonSecondary]}
                            onPress={() => addItemToPantry('family')}
                        >
                            <Text style={styles.pantryChoiceButtonText}>{t('confirm_pantry_choice_family')}</Text>
                        </Pressable>
                    </View>
                </View>
            </CustomModal>

            {/* Custom Alert */}
            <CustomAlert
                visible={showAlert.visible}
                title={showAlert.title}
                message={showAlert.message}
                buttons={showAlert.buttons}
                onClose={() => setShowAlert(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    subHeader: {
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
    helpButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    successBanner: {
        flexDirection: 'row',
        padding: 20,
        marginTop: 20,
        backgroundColor: `rgba(16, 185, 129, 0.1)`,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `rgba(16, 185, 129, 0.2)`,
    },
    successIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.secondaryColor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successContent: {
        flex: 1,
        marginLeft: 16,
    },
    successTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: '#064E3B',
        lineHeight: 22,
    },
    successSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: '#047857',
        lineHeight: 18,
        marginTop: 4,
    },
    productCard: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 20,
        marginTop: 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    productHeader: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    productImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: Colors.backgroundColor,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productImagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    productHeaderContent: {
        flex: 1,
        marginLeft: 16,
    },
    productCardTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        lineHeight: 22,
    },
    productCardSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 18,
        marginTop: 4,
    },
    aiDetectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `rgba(16, 185, 129, 0.1)`,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `rgba(16, 185, 129, 0.3)`,
        alignSelf: 'flex-start',
        marginTop: 8,
    },
    aiDetectedText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.secondaryColor,
        marginLeft: 4,
    },
    formSection: {
        gap: 16,
    },
    formField: {
        gap: 8,
    },
    formRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    formRowSpacer: {
        width: 16,
    },
    fieldHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fieldLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    detectedBadge: {
        backgroundColor: `rgba(16, 185, 129, 0.1)`,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    detectedBadgeText: {
        fontFamily: 'Inter-Medium',
        fontSize: 10,
        color: Colors.secondaryColor,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    inputError: {
        borderColor: Colors.red,
        borderWidth: 1.5,
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    textInputMultiline: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    dateText: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    placeholderText: {
        color: Colors.textTertiary,
    },
    errorText: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.red,
        marginTop: 4,
        marginLeft: 4,
    },
    actionButtons: {
        marginTop: 32,
        marginBottom: 20,
        gap: 12,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.secondaryColor,
        paddingVertical: 16,
        borderRadius: 14,
    },
    addButtonDisabled: {
        backgroundColor: `rgba(16, 185, 129, 0.5)`,
    },
    addButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.backgroundWhite,
        marginLeft: 8,
    },
    scanAgainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.backgroundWhite,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.borderColor,
    },
    scanAgainText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textSecondary,
        marginLeft: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderColor,
    },
    modalTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    modalCloseButton: {
        padding: 4,
    },
    modalContent: {
        padding: 20,
    },
    optionsList: {
        maxHeight: 300,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    optionItemSelected: {
        backgroundColor: `rgba(16, 185, 129, 0.1)`,
        borderWidth: 1,
        borderColor: `rgba(16, 185, 129, 0.3)`,
    },
    optionText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    optionTextSelected: {
        fontFamily: 'Inter-Medium',
        color: Colors.secondaryColor,
    },
    // Alert styles
    alertContainer: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 24,
        width: '85%',
        alignItems: 'center',
    },
    alertTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 20,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    alertMessage: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    alertButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    alertButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: Colors.secondaryColor,
        alignItems: 'center',
    },
    alertButtonDestructive: {
        backgroundColor: Colors.red,
    },
    alertButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    alertButtonTextDestructive: {
        color: Colors.backgroundWhite,
    },
    datePickerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.borderColor,
    },
    datePickerButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: Colors.secondaryColor,
        alignItems: 'center',
    },
    datePickerButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    pantryChoiceContent: {
        padding: 10,
        alignItems: 'center',
    },
    pantryChoiceMessage: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    pantryChoiceButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    pantryChoiceButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    pantryChoiceButtonPrimary: {
        backgroundColor: Colors.secondaryColor,
    },
    pantryChoiceButtonSecondary: {
        backgroundColor: Colors.freshGreen,
        borderWidth: 1,
        borderColor: Colors.borderColor,
    },
    pantryChoiceButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
});