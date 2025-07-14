import CustomAppBar from '@/components/ui/CustomAppBar';
import { Colors } from '@/constants/Colors';
import { FoodItem } from '@/src/models/FoodItem';
import { Recipe, getCategoryColor } from '@/src/models/RecipeModel';
import { activityService } from '@/src/services/ActivityService';
import { useAuth } from '@/src/services/AuthContext';
import { inventoryService } from '@/src/services/InventoryService';
import { recipeService } from '@/src/services/RecipeService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function RecipesScreen() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUsingFallback, setIsUsingFallback] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRecipes = useCallback(async () => {
        if (!user) return;

        setIsLoading(true);
        setError(null);

        try {
            // Get all items from inventory
            const items: FoodItem[] = await new Promise((resolve) => {
                const unsubscribe = inventoryService.listenFoodItems((list) => {
                    unsubscribe();
                    resolve(list);
                });
            });

            let ingredients = items.map(item => item.name);

            // Fallback ingredients if pantry is empty
            if (ingredients.length === 0) {
                setIsUsingFallback(true);
                ingredients = ['Eggs', 'Milk', 'Bread', 'Tomato', 'Onion', 'Garlic', 'Chicken'];
            } else {
                setIsUsingFallback(false);
            }

            // Fetch recipes by ingredients
            const basicRecipes = await recipeService.getRecipesByIngredients(
                ingredients,
                isUsingFallback ? 10 : 20
            );

            if (basicRecipes.length === 0) {
                setRecipes([]);
                setFilteredRecipes([]);
                return;
            }

            // Get detailed information
            const recipeIds = basicRecipes.map(r => r.id);
            const detailedRecipes = await recipeService.getRecipesInformationBulk(recipeIds);

            // Combine basic info with detailed info
            const finalRecipes = detailedRecipes.map(detailed => {
                const basic = basicRecipes.find(b => b.id === detailed.id);
                return {
                    ...detailed,
                    usedIngredientCount: basic?.usedIngredientCount || 0,
                    missedIngredientCount: basic?.missedIngredientCount || 0,
                };
            });

            setRecipes(finalRecipes);
            setFilteredRecipes(finalRecipes);
        } catch (err) {
            console.error('Error fetching recipes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load recipes');
        } finally {
            setIsLoading(false);
        }
    }, [user, isUsingFallback]);

    useEffect(() => {
        fetchRecipes();
    }, [fetchRecipes]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = recipes.filter(recipe =>
            recipe.title.toLowerCase().includes(query)
        );
        setFilteredRecipes(filtered);
    }, [searchQuery, recipes]);

    const handleRecipePress = (recipe: Recipe) => {
        // Log activity
        activityService.logRecipeViewed(recipe.title, recipe.imageUrl);

        // Navigate to recipe detail
        router.push({
            pathname: '/recipe-detail',
            params: { recipeData: JSON.stringify(recipe) }
        });
    };

    const renderRecipeCard = ({ item }: { item: Recipe }) => (
        <RecipeCard recipe={item} onPress={() => handleRecipePress(item)} isUsingFallback={isUsingFallback} />
    );

    if (!user) {
        return (
            <View style={styles.container}>
                <CustomAppBar title="Eatsooon" />
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{t('recipes_sign_in_required')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CustomAppBar title="Eatsooon" />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('recipes_search_hint')}
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                        <MaterialIcons name="close" size={20} color="#9CA3AF" />
                    </Pressable>
                )}
            </View>

            {/* Fallback Notice */}
            {isUsingFallback && (
                <View style={styles.fallbackNotice}>
                    <MaterialIcons name="info" size={20} color="#0C4A6E" />
                    <Text style={styles.fallbackText}>
                        {t('recipes_showing_popular')}
                    </Text>
                </View>
            )}

            {/* Content */}
            {isLoading ? (
                <RecipesSkeleton />
            ) : error ? (
                <View style={styles.centerContent}>
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>{t('recipes_error_loading_title')}</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <Pressable style={styles.retryButton} onPress={fetchRecipes}>
                        <Text style={styles.retryButtonText}>{t('recipes_retry')}</Text>
                    </Pressable>
                </View>
            ) : filteredRecipes.length === 0 ? (
                <View style={styles.centerContent}>
                    <MaterialIcons name="restaurant-menu" size={64} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>{t('recipes_no_recipes_found')}</Text>
                    <Text style={styles.emptyText}>
                        {searchQuery ? t('recipes_adjust_search') : t('recipes_add_ingredients')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredRecipes}
                    renderItem={renderRecipeCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        const key = `recipe_cat_${category.toLowerCase().replace(/\s+/g, '_')}`;
        const translated = t(key);
        return translated === key ? category : translated;
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
                <Image
                    source={{ uri: recipe.imageUrl }}
                    style={styles.recipeImage}
                    resizeMode="cover"
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
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 14.4,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        marginTop: 20,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textPrimary,
        marginLeft: 8,
    },
    fallbackNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE',
        borderColor: '#7DD3FC',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        margin: 20,
    },
    fallbackText: {
        flex: 1,
        marginLeft: 12,
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: '#0C4A6E',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
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
    emptyTitle: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    listContainer: {
        padding: 20,
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
}); 