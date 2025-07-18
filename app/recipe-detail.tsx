import { Colors } from '@/constants/Colors';
import RecipeImage from '@/src/components/ui/RecipeImage';
import { Recipe, getCategoryColor, getEmojiForIngredient } from '@/src/models/RecipeModel';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function RecipeDetailScreen() {
    const { recipeData } = useLocalSearchParams();
    const { t } = useTranslation();
    const router = useRouter();
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [selectedServings, setSelectedServings] = useState(4);

    useEffect(() => {
        if (recipeData && typeof recipeData === 'string') {
            try {
                const parsedRecipe = JSON.parse(recipeData) as Recipe;
                setRecipe(parsedRecipe);

                // Parse servings from string like "4 servings"
                const servingsMatch = parsedRecipe.servings.match(/(\d+)/);
                if (servingsMatch) {
                    setSelectedServings(parseInt(servingsMatch[1], 10));
                }

                // Note: Recipe viewed activity is already logged in recipes screen
                // when user taps to view the recipe, so we don't log it again here
            } catch (error) {
                console.error('Error parsing recipe data:', error);
                router.back();
            }
        }
    }, [recipeData, router]);

    const adjustServings = (change: number) => {
        setSelectedServings(prev => Math.max(1, Math.min(12, prev + change)));
    };

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

    if (!recipe) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{t('recipe_detail_not_found')}</Text>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>{t('recipe_detail_go_back')}</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    const categoryColor = getCategoryColor(recipe.difficulty);

    return (
        <View style={styles.container}>
            {/* Sub-header */}
            <View style={styles.subHeader}>
                <Pressable style={styles.backIconContainer} onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#4B5563" />
                </Pressable>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{recipe.title}</Text>
                    <Text style={styles.headerSubtitle}>{translateCategory(recipe.category)}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroImageContainer}>
                    <RecipeImage
                        imageUrl={recipe.imageUrl}
                        style={styles.heroImage}
                        containerStyle={styles.heroImage}
                        fallbackIcon="restaurant-outline"
                        fallbackColor="#6B7280"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
                        locations={[0.6, 0.8, 1.0]}
                        style={styles.heroGradient}
                    />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Meta Info Card */}
                    <View style={styles.metaInfoCard}>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <MaterialIcons name="timer" size={28} color="#F59E0B" />
                                <Text style={styles.metaValue}>{recipe.cookTime}</Text>
                                <Text style={styles.metaLabel}>{t('recipe_detail_cook_time')}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.metaItem}>
                                <MaterialIcons name="star-border" size={28} color="#FFC107" />
                                <Text style={styles.metaValue}>{translateDifficulty(recipe.difficulty)}</Text>
                                <Text style={styles.metaLabel}>{t('recipe_detail_difficulty')}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.metaItem}>
                                <MaterialIcons name="people" size={28} color="#2196F3" />
                                <Text style={styles.metaValue}>{selectedServings}</Text>
                                <Text style={styles.metaLabel}>{t('recipe_detail_servings')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('recipe_detail_description')}</Text>
                        <Text style={styles.description}>{recipe.description}</Text>
                    </View>

                    {/* Ingredients */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('recipe_detail_ingredients')}</Text>
                        {recipe.ingredients.map((ingredient, index) => (
                            <View key={index} style={styles.ingredientItem}>
                                <Text style={styles.ingredientEmoji}>
                                    {getEmojiForIngredient(ingredient.name)}
                                </Text>
                                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Instructions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('recipe_detail_instructions')}</Text>
                        {recipe.instructions.length === 0 ? (
                            <Text style={styles.noInstructions}>{t('recipe_detail_no_instructions')}</Text>
                        ) : (
                            recipe.instructions.map((instruction, index) => (
                                <View key={index} style={styles.instructionItem}>
                                    <View style={[styles.stepNumber, { backgroundColor: categoryColor }]}>
                                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.instructionText}>{instruction}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Bottom padding */}
                    <View style={{ height: 32 }} />
                </View>
            </ScrollView>

            {/* Removed floating favorite button */}
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
        backgroundColor: Colors.backgroundWhite,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backIconContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        lineHeight: 23,
    },
    headerSubtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 17,
    },
    scrollView: {
        flex: 1,
    },
    heroImageContainer: {
        height: 250,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
    },
    content: {
        padding: 20,
    },
    metaInfoCard: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    metaItem: {
        alignItems: 'center',
        flex: 1,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
    },
    metaValue: {
        fontFamily: 'Inter-Bold',
        fontSize: 16,
        color: Colors.textPrimary,
        marginTop: 8,
    },
    metaLabel: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    servingsChanger: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontFamily: 'Nunito-Bold',
        fontSize: 20,
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    description: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    ingredientEmoji: {
        fontSize: 24,
        marginRight: 16,
    },
    ingredientName: {
        flex: 1,
        fontFamily: 'Inter-Medium',
        fontSize: 15,
        color: Colors.textPrimary,
    },
    ingredientAmount: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    instructionItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        marginTop: 2,
    },
    stepNumberText: {
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        color: Colors.backgroundWhite,
    },
    instructionText: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
    },
    noInstructions: {
        fontFamily: 'Inter-Regular',
        fontSize: 15,
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    errorText: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: Colors.secondaryColor,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: Colors.backgroundWhite,
    },
}); 