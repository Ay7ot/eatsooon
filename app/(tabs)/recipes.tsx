import CustomAppBar from '@/components/ui/CustomAppBar';
import { Colors } from '@/constants/Colors';
import RecipeImage from '@/src/components/ui/RecipeImage';
import { useLanguage } from '@/src/localization/LanguageContext';
import { FoodItem } from '@/src/models/FoodItem';
import { Recipe, getCategoryColor } from '@/src/models/RecipeModel';
import { activityService } from '@/src/services/ActivityService';
import { adMobService } from '@/src/services/AdMobService';
import { useAuth } from '@/src/services/AuthContext';
import { inventoryService } from '@/src/services/InventoryService';
import { recipeService } from '@/src/services/RecipeService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

export default function RecipesScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { currentLanguage } = useLanguage();
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Ingredient selection state
    const [showIngredientModal, setShowIngredientModal] = useState(false);
    const [allItems, setAllItems] = useState<FoodItem[]>([]);
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
    const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
    const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);

    // Track if we've already shown the initial interstitial ad
    const [hasShownInitialAd, setHasShownInitialAd] = useState(false);

    // Animation values
    const modalAnimation = useState(new Animated.Value(0))[0];
    const fadeAnimation = useState(new Animated.Value(0))[0];

    useEffect(() => {
        fetchRecipes();
    }, [user, currentLanguage]);

    const fetchAllItems = async () => {
        setIsLoadingIngredients(true);
        try {
            const items = await inventoryService.getAllItems();
            setAllItems(items);
        } catch (error) {
            console.error('Error fetching all items:', error);
        } finally {
            setIsLoadingIngredients(false);
        }
    };

    const handleToggleIngredient = (ingredientName: string) => {
        setSelectedIngredients(prev =>
            prev.includes(ingredientName)
                ? prev.filter(name => name !== ingredientName)
                : [...prev, ingredientName]
        );
    };

    const handleSelectAll = () => {
        const filteredItems = getFilteredIngredients();
        const allNames = filteredItems.map(item => item.name);
        setSelectedIngredients(prev => {
            const newSelection = [...new Set([...prev, ...allNames])];
            return newSelection;
        });
    };

    const handleClearAll = () => {
        setSelectedIngredients([]);
    };

    const getFilteredIngredients = () => {
        if (!ingredientSearchQuery.trim()) return allItems;

        return allItems.filter(item =>
            item.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase()) ||
            (item.category || '').toLowerCase().includes(ingredientSearchQuery.toLowerCase())
        );
    };

    const openIngredientModal = async () => {
        setShowIngredientModal(true);
        await fetchAllItems();

        // Animate modal in
        Animated.parallel([
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeIngredientModal = () => {
        Animated.parallel([
            Animated.timing(modalAnimation, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnimation, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowIngredientModal(false);
            setIngredientSearchQuery('');
        });
    };

    const generateRecipesWithSelected = async () => {
        if (selectedIngredients.length === 0) return;

        closeIngredientModal();
        setIsLoading(true);
        setError(null);

        // Temporarily disable interstitial ad during recipe loading to prevent scroll issues
        // adMobService.showInterstitialAdOnTrigger('recipe_loading');

        try {
            const generatedRecipes = await recipeService.getRecipesByIngredients(
                selectedIngredients,
                7,
                true,
                false
            );
            setRecipes(generatedRecipes);
        } catch (error) {
            console.error('Error generating recipes with selected ingredients:', error);
            setError('Failed to generate recipes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRecipes = async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        // Clear selected ingredients when fetching default recipes
        setSelectedIngredients([]);

        // Show an interstitial ad only the very first time the screen loads
        if (!hasShownInitialAd) {
            adMobService.showInterstitialAdOnTrigger('recipe_loading');
            setHasShownInitialAd(true);
        }

        try {
            // First, try to get items that are expiring soon (within 3 days)
            let expiringItems: FoodItem[] = [];
            try {
                expiringItems = await inventoryService.getExpiringSoonItems(3);
            } catch (error) {
                console.warn('Error fetching expiring items:', error);
            }

            let recipes: Recipe[] = [];

            if (expiringItems.length > 0) {
                // Use expiring items to generate recipes
                const ingredientNames = expiringItems.map(item => item.name);
                recipes = await recipeService.getRecipesByIngredients(
                    ingredientNames,
                    7,
                    true, // use cache
                    true  // is expiring soon
                );
            } else {
                // Fallback to default recipes if no expiring items
                recipes = await recipeService.getRecipesByIngredients([], 7, true, false);
            }

            setRecipes(recipes);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            setError('Failed to load recipes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchRecipes();
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const searchResults = await recipeService.searchRecipes(searchQuery, 10);
            setRecipes(searchResults);
        } catch (error) {
            console.error('Error searching recipes:', error);
            setError('Failed to search recipes. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        fetchRecipes();
    };

    const handleRecipePress = async (recipe: Recipe) => {
        // Log activity
        await activityService.logRecipeViewed(recipe.title, recipe.imageUrl);

        // Show interstitial ad occasionally
        // adMobService.showInterstitialAdOnTrigger('recipe_view');

        router.push({
            pathname: '/recipe-detail',
            params: { recipeData: JSON.stringify(recipe) }
        });
    };

    const renderRecipeCard = ({ item }: { item: Recipe }) => (
        <RecipeCard
            recipe={item}
            onPress={() => handleRecipePress(item)}
            isUsingFallback={recipes.length === 0}
        />
    );

    const getEmojiForCategory = (category: string) => {
        const c = category.toLowerCase();
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
        return '🥫';
    };

    const renderIngredientItem = ({ item }: { item: FoodItem }) => {
        const isSelected = selectedIngredients.includes(item.name);
        const emoji = getEmojiForCategory(item.category || 'other');

        return (
            <Pressable
                style={[styles.ingredientItem, isSelected && styles.ingredientItemSelected]}
                onPress={() => handleToggleIngredient(item.name)}
            >
                <View style={styles.ingredientContent}>
                    <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientEmoji}>{emoji}</Text>
                        <View style={styles.ingredientTextContainer}>
                            <Text style={[styles.ingredientName, isSelected && styles.ingredientNameSelected]}>
                                {item.name}
                            </Text>
                            <Text style={[styles.ingredientDetails, isSelected && styles.ingredientDetailsSelected]}>
                                {item.quantity} {item.unit} • {item.category}
                            </Text>
                        </View>
                    </View>
                    {isSelected && (
                        <MaterialIcons
                            name="check-circle"
                            size={20}
                            color={Colors.secondaryColor}
                            style={styles.checkIcon}
                        />
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            {/* Header Section */}
            <View style={styles.headerSection}>
                <Text style={styles.headerTitle}>{t('recipes', 'Recipes')}</Text>
                <Text style={styles.headerSubtitle}>
                    {selectedIngredients.length > 0
                        ? t('recipes_using_selected', { count: selectedIngredients.length })
                        : searchQuery.trim()
                            ? t('recipes_search_results', 'Search results')
                            : t('recipes_using_expiring', 'Using expiring ingredients')}
                </Text>
            </View>

            {/* Search and Filter Section */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <MaterialIcons name="search" size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_recipes')}
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={handleClearSearch}>
                            <MaterialIcons name="close" size={20} color="#9CA3AF" />
                        </Pressable>
                    )}
                </View>

                <Pressable style={styles.ingredientButton} onPress={openIngredientModal}>
                    <MaterialIcons name="tune" size={20} color={Colors.secondaryColor} />
                    <Text style={styles.ingredientButtonText}>
                        {t('recipes_select_ingredients')}
                    </Text>
                    {selectedIngredients.length > 0 && (
                        <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>{selectedIngredients.length}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Content */}
            {isLoading ? (
                <RecipesSkeleton />
            ) : error ? (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable style={styles.retryButton} onPress={fetchRecipes}>
                        <Text style={styles.retryButtonText}>{t('retry', 'Retry')}</Text>
                    </Pressable>
                </View>
            ) : (
                <FlatList
                    style={{ flex: 1 }}
                    data={recipes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderRecipeCard}
                    contentContainerStyle={styles.recipesList}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                />
            )}

            {/* Ingredient Selection Modal */}
            <Modal
                visible={showIngredientModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeIngredientModal}
            >
                <Animated.View
                    style={[
                        styles.modalOverlay,
                        {
                            opacity: fadeAnimation,
                        }
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [{
                                    translateY: modalAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [600, 0],
                                    })
                                }]
                            }
                        ]}
                    >
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderContent}>
                                <Text style={styles.modalTitle}>{t('recipes_ingredient_selection_title')}</Text>
                                <Text style={styles.modalSubtitle}>{t('recipes_ingredient_selection_subtitle')}</Text>
                            </View>
                            <Pressable style={styles.modalCloseButton} onPress={closeIngredientModal}>
                                <MaterialIcons name="close" size={24} color="#6B7280" />
                            </Pressable>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.modalSearchContainer}>
                            <MaterialIcons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder={t('recipes_search_ingredients')}
                                placeholderTextColor="#9CA3AF"
                                value={ingredientSearchQuery}
                                onChangeText={setIngredientSearchQuery}
                            />
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <Pressable style={styles.actionButton} onPress={handleSelectAll}>
                                <Text style={styles.actionButtonText}>{t('recipes_select_all')}</Text>
                            </Pressable>
                            <Pressable style={styles.actionButton} onPress={handleClearAll}>
                                <Text style={styles.actionButtonText}>{t('recipes_clear_selection')}</Text>
                            </Pressable>
                            <View style={styles.selectedCount}>
                                <Text style={styles.selectedCountText}>
                                    {t('recipes_selected_count', { count: selectedIngredients.length })}
                                </Text>
                            </View>
                        </View>

                        {/* Ingredients List */}
                        {isLoadingIngredients ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={Colors.secondaryColor} />
                                <Text style={styles.loadingText}>{t('recipes_loading_ingredients')}</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={getFilteredIngredients()}
                                keyExtractor={(item) => item.id}
                                renderItem={renderIngredientItem}
                                style={styles.ingredientsList}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <MaterialIcons name="inventory-2" size={48} color="#9CA3AF" />
                                        <Text style={styles.emptyText}>{t('recipes_no_ingredients_found')}</Text>
                                    </View>
                                }
                            />
                        )}

                        {/* Generate Button */}
                        <View style={styles.modalFooter}>
                            <Pressable
                                style={[
                                    styles.generateButton,
                                    selectedIngredients.length === 0 && styles.generateButtonDisabled
                                ]}
                                onPress={generateRecipesWithSelected}
                                disabled={selectedIngredients.length === 0}
                            >
                                <MaterialIcons
                                    name="restaurant"
                                    size={20}
                                    color={selectedIngredients.length > 0 ? Colors.backgroundWhite : '#9CA3AF'}
                                />
                                <Text style={[
                                    styles.generateButtonText,
                                    selectedIngredients.length === 0 && styles.generateButtonTextDisabled
                                ]}>
                                    {t('recipes_generate_recipes')}
                                </Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        </View>
    );
}

function RecipeCard({ recipe, onPress, isUsingFallback }: {
    recipe: Recipe;
    onPress: () => void;
    isUsingFallback: boolean;
}) {
    const { t } = useTranslation();
    const categoryColor = getCategoryColor(recipe.difficulty);

    // Helper to translate recipe category names
    const translateCategory = (category: string) => {
        // First try the direct category as a translation key
        const directKey = `recipe_cat_${category.toLowerCase().replace(/\s+/g, '_')}`;
        const directTranslation = t(directKey);
        if (directTranslation !== directKey) {
            return directTranslation;
        }

        // If that fails, try to map common Spanish categories to English equivalents
        const spanishToEnglish: { [key: string]: string } = {
            'desayuno': 'breakfast',
            'ensalada': 'salad',
            'almuerzo': 'lunch',
            'cena': 'dinner',
            'postre': 'dessert',
            'sopa': 'soup',
            'bebida': 'beverage',
            'aperitivo': 'appetizer',
            'snack': 'snack',
            'general': 'general',
            'comida_para_picar': 'fingerfood',
            'marinada': 'marinade',
            'salsa': 'sauce',
            'condimento': 'condiment',
            'antipasti': 'antipasti'
        };

        const englishCategory = spanishToEnglish[category.toLowerCase()];
        if (englishCategory) {
            const englishKey = `recipe_cat_${englishCategory}`;
            const englishTranslation = t(englishKey);
            return englishTranslation !== englishKey ? englishTranslation : category;
        }

        // Fallback to original category if no translation found
        return category;
    };

    // Helper to translate difficulty values
    const translateDifficulty = (difficulty: string) => {
        const map: { [key: string]: string } = {
            'easy': 'recipes_diff_easy',
            'medium': 'recipes_diff_medium',
            'hard': 'recipes_diff_hard',
        };
        const key = map[difficulty.toLowerCase()];
        if (!key) return difficulty;
        const translated = t(key);
        return translated === key ? difficulty : translated;
    };

    return (
        <Pressable style={[styles.recipeCard, { borderColor: categoryColor + '80' }]} onPress={onPress}>
            {/* Image */}
            <View style={styles.imageContainer}>
                <RecipeImage
                    imageUrl={recipe.imageUrl}
                    style={styles.recipeImage}
                    containerStyle={styles.recipeImage}
                    fallbackIcon="restaurant-outline"
                    fallbackColor="#6B7280"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.imageGradient}
                />

                {/* Category Tag */}
                <View style={[styles.categoryTag, { backgroundColor: categoryColor }]}>
                    <Text style={styles.categoryText}>{translateCategory(recipe.category).toUpperCase()}</Text>
                </View>

                {/* Title */}
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
            </View>

            {/* Details */}
            <View style={styles.recipeDetails}>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                    {recipe.description}
                </Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <MaterialIcons name="timer" size={16} color="#6B7280" />
                        <Text style={styles.statText}>{recipe.cookTime}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialIcons name="people" size={16} color="#6B7280" />
                        <Text style={styles.statText}>{recipe.servings}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialIcons name="star-border" size={16} color="#6B7280" />
                        <Text style={styles.statText}>{translateDifficulty(recipe.difficulty)}</Text>
                    </View>
                </View>

                {/* Ingredient chips and view button */}
                <View style={styles.bottomRow}>
                    <View style={styles.ingredientChips}>
                        {!isUsingFallback && recipe.usedIngredientCount > 0 && (
                            <View style={styles.usedChip}>
                                <Text style={styles.usedChipText}>{recipe.usedIngredientCount} {t('recipes_used')}</Text>
                            </View>
                        )}
                        {!isUsingFallback && recipe.missedIngredientCount > 0 && (
                            <View style={styles.missedChip}>
                                <Text style={styles.missedChipText}>{recipe.missedIngredientCount} {t('recipes_missing')}</Text>
                            </View>
                        )}
                    </View>
                    <Pressable style={[styles.viewButton, { backgroundColor: categoryColor }]} onPress={onPress}>
                        <Text style={styles.viewButtonText}>{t('recipes_view_recipe')}</Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
}

function RecipesSkeleton() {
    return (
        <ScrollView style={[styles.recipesList, { paddingBottom: 96 }]} showsVerticalScrollIndicator={false}>
            {Array.from({ length: 5 }).map((_, idx) => (
                <View key={idx} style={styles.skeletonCard} />
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 28,
        color: Colors.textPrimary,
    },
    headerSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
        gap: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 14.4,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        paddingHorizontal: 16,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
        marginLeft: 8,
    },
    ingredientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 14.4,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        paddingHorizontal: 16,
        height: 48,
        gap: 8,
    },
    ingredientButtonText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary,
    },
    selectedBadge: {
        backgroundColor: Colors.secondaryColor,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    selectedBadgeText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.backgroundWhite,
    },
    recipesList: {
        padding: 20,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: Colors.secondaryColor,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.backgroundWhite,
    },
    recipeCard: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        borderWidth: 1.5,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    recipeImage: {
        width: '100%',
        height: '100%',
    },
    imageGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
    },
    categoryTag: {
        position: 'absolute',
        top: 12,
        left: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    categoryText: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: Colors.backgroundWhite,
    },
    recipeTitle: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        color: Colors.backgroundWhite,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    recipeDetails: {
        padding: 16,
    },
    recipeDescription: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ingredientChips: {
        flexDirection: 'row',
        flex: 1,
    },
    usedChip: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 8,
    },
    usedChipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#065F46',
    },
    missedChip: {
        backgroundColor: '#FEE2E2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        marginRight: 8,
    },
    missedChipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: '#7F1D1D',
    },
    viewButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    viewButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.backgroundWhite,
    },
    skeletonCard: {
        height: 250,
        backgroundColor: '#E5E7EB',
        borderRadius: 16,
        marginBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
        width: '100%',
        height: '70%',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 20,
        padding: 0,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalHeaderContent: {
        flex: 1,
    },
    modalTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 24,
        color: Colors.textPrimary,
    },
    modalSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    modalCloseButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        marginVertical: 16,
        height: 48,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    modalSearchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
        marginLeft: 12,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
        alignItems: 'center',
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: Colors.textSecondary,
    },
    selectedCount: {
        backgroundColor: Colors.secondaryColor + '15',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.secondaryColor + '30',
    },
    selectedCountText: {
        fontFamily: 'Inter-Bold',
        fontSize: 12,
        color: Colors.secondaryColor,
    },
    ingredientsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: Colors.backgroundWhite,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    ingredientItemSelected: {
        backgroundColor: Colors.secondaryColor + '10',
        borderColor: Colors.secondaryColor + '40',
        shadowColor: Colors.secondaryColor,
        shadowOpacity: 0.1,
        elevation: 2,
    },
    ingredientContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    ingredientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    ingredientEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    ingredientTextContainer: {
        flex: 1,
    },
    ingredientName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginBottom: 2,
    },
    ingredientNameSelected: {
        fontFamily: 'Inter-Bold',
        color: Colors.secondaryColor,
    },
    ingredientDetails: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: Colors.textSecondary,
    },
    ingredientDetailsSelected: {
        fontFamily: 'Inter-Medium',
        color: Colors.secondaryColor,
        opacity: 0.8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        marginLeft: 'auto',
        marginRight: 16,
    },
    checkboxSelected: {
        backgroundColor: Colors.secondaryColor,
        borderColor: Colors.secondaryColor,
    },
    checkIcon: {
        marginLeft: 'auto',
        marginRight: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 16,
        textAlign: 'center',
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FAFBFC',
    },
    generateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.secondaryColor,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: Colors.secondaryColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    generateButtonText: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.backgroundWhite,
        marginLeft: 8,
    },
    generateButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    generateButtonTextDisabled: {
        color: '#9CA3AF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 16,
    },
}); 