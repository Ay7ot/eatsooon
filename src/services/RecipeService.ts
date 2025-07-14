import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../localization/i18n';
import { Recipe } from '../models/RecipeModel';
import { RecipeErrorHandler } from '../utils/recipeErrorHandler';
import { aiRecipeService } from './AIRecipeService';
import { defaultRecipeLoader } from './DefaultRecipeLoader';
import { translationService } from './TranslationService';

class RecipeService {
    private static _instance: RecipeService;
    static get instance() {
        if (!this._instance) this._instance = new RecipeService();
        return this._instance;
    }
    private constructor() {
        this.initializePersistedCache();
    }

    // Cache for generated recipes to avoid duplicate API calls
    private recipeCache = new Map<string, Recipe[]>();
    private cacheExpiry = new Map<string, number>();
    private fullRecipeCache = new Map<number, Recipe>(); // New cache for individual recipes by ID
    private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // Increased to 2 hours
    private readonly PERSISTENT_CACHE_KEY = 'recipe_cache_v1';

    // Background generation queue
    private backgroundQueue: Array<{ ingredients: string[], limit: number }> = [];
    private isProcessingBackground = false;

    /**
     * Initialize persisted cache from AsyncStorage
     */
    private async initializePersistedCache(): Promise<void> {
        try {
            const cachedData = await AsyncStorage.getItem(this.PERSISTENT_CACHE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                const now = Date.now();

                // Restore non-expired cache entries
                Object.entries(parsed.recipes || {}).forEach(([key, data]: [string, any]) => {
                    if (data.expiry > now) {
                        this.recipeCache.set(key, data.recipes);
                        this.cacheExpiry.set(key, data.expiry);

                        // Also restore individual recipe cache
                        data.recipes.forEach((recipe: Recipe) => {
                            this.fullRecipeCache.set(recipe.id, recipe);
                        });
                    }
                });

                console.log(`Restored ${this.recipeCache.size} cached recipe sets from storage`);
            }
        } catch (error) {
            console.warn('Failed to restore recipe cache:', error);
        }
    }

    /**
     * Persist cache to AsyncStorage
     */
    private async persistCache(): Promise<void> {
        try {
            const cacheData = {
                recipes: Object.fromEntries(
                    Array.from(this.recipeCache.entries()).map(([key, recipes]) => [
                        key,
                        {
                            recipes,
                            expiry: this.cacheExpiry.get(key) || 0
                        }
                    ])
                ),
                timestamp: Date.now()
            };

            await AsyncStorage.setItem(this.PERSISTENT_CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to persist recipe cache:', error);
        }
    }

    /**
     * Get recipes by ingredients - now with faster loading and background updates
     * @param ingredients Array of ingredient names from user's inventory
     * @param limit Number of recipes to return
     * @param useCache Whether to return cached results immediately
     * @returns Promise<Recipe[]>
     */
    async getRecipesByIngredients(
        ingredients: string[],
        limit: number = 20,
        useCache: boolean = true
    ): Promise<Recipe[]> {
        try {
            let recipes: Recipe[];

            if (ingredients.length === 0) {
                // No ingredients provided - return default recipes
                console.log('No ingredients provided, using default recipes');
                recipes = this.getDefaultRecipesForUser(limit);
            } else {
                // Check cache first for immediate results
                const cacheKey = ingredients.sort().join(',') + `_${limit}`;

                if (useCache && this.recipeCache.has(cacheKey)) {
                    const expiry = this.cacheExpiry.get(cacheKey) || 0;
                    if (Date.now() < expiry) {
                        console.log('Returning cached recipes immediately');
                        recipes = this.recipeCache.get(cacheKey) || [];

                        // Queue background refresh if cache is > 30 minutes old
                        const cacheAge = Date.now() - (expiry - this.CACHE_DURATION);
                        if (cacheAge > 30 * 60 * 1000) {
                            this.queueBackgroundGeneration(ingredients, limit);
                        }

                        return this.applyTranslationsIfNeeded(recipes);
                    }
                }

                // Generate new recipes
                console.log('Generating fresh recipes');
                recipes = await this.getAIGeneratedRecipes(ingredients, limit);

                // If AI generation fails, fall back to default recipes
                if (recipes.length === 0) {
                    console.log('AI generation failed, falling back to default recipes');
                    recipes = this.getDefaultRecipesForUser(limit);
                }
            }

            return this.applyTranslationsIfNeeded(recipes);
        } catch (error) {
            const recipeError = RecipeErrorHandler.handleError(error, 'getRecipesByIngredients');
            RecipeErrorHandler.logError(recipeError);

            // Final fallback - always return default recipes on error
            const fallbackRecipes = this.getDefaultRecipesForUser(limit);
            return this.applyTranslationsIfNeeded(fallbackRecipes);
        }
    }

    /**
     * Get detailed recipe information - now works with our generated IDs
     * @param ids Array of recipe IDs
     * @returns Promise<Recipe[]>
     */
    async getRecipesInformationBulk(ids: number[]): Promise<Recipe[]> {
        try {
            if (ids.length === 0) {
                return [];
            }

            let recipes: Recipe[] = [];

            // Check if these are default recipe IDs (1000-1999 range)
            const defaultRecipeIds = ids.filter(id => id >= 1000 && id < 2000);
            const aiRecipeIds = ids.filter(id => id >= 2000);

            // Get default recipes
            if (defaultRecipeIds.length > 0) {
                const allDefaultRecipes = defaultRecipeLoader.getDefaultRecipes();
                const defaultRecipes = allDefaultRecipes.filter(recipe =>
                    defaultRecipeIds.includes(recipe.id)
                );
                recipes.push(...defaultRecipes);
            }

            // Get AI-generated recipes from cache
            if (aiRecipeIds.length > 0) {
                console.log('Retrieving AI-generated recipes from cache');
                const aiRecipes = aiRecipeIds
                    .map(id => this.fullRecipeCache.get(id))
                    .filter((recipe): recipe is Recipe => recipe !== undefined);

                recipes.push(...aiRecipes);

                if (aiRecipes.length !== aiRecipeIds.length) {
                    console.warn(`Found ${aiRecipes.length} of ${aiRecipeIds.length} requested AI recipes in cache`);
                }
            }

            // Apply translations if language is Spanish
            if (i18n.language === 'es') {
                return Promise.all(recipes.map((r: Recipe) => translationService.translateRecipe(r, 'es')));
            }

            return recipes;
        } catch (error) {
            console.error('Error in getRecipesInformationBulk:', error);
            return [];
        }
    }

    /**
     * Get AI-generated recipes with caching and persistence
     */
    private async getAIGeneratedRecipes(ingredients: string[], limit: number): Promise<Recipe[]> {
        const cacheKey = ingredients.sort().join(',') + `_${limit}`;
        const now = Date.now();

        // Check cache first
        if (this.recipeCache.has(cacheKey)) {
            const expiry = this.cacheExpiry.get(cacheKey) || 0;
            if (now < expiry) {
                console.log('Returning cached AI recipes');
                return this.recipeCache.get(cacheKey) || [];
            }
        }

        try {
            const recipes = await aiRecipeService.generateRecipes(ingredients, limit);

            if (recipes.length > 0) {
                // Cache the results in both caches
                this.recipeCache.set(cacheKey, recipes);
                this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

                // Also cache individual recipes by ID for bulk retrieval
                recipes.forEach(recipe => {
                    this.fullRecipeCache.set(recipe.id, recipe);
                });

                // Persist to storage
                this.persistCache();

                console.log(`Generated and cached ${recipes.length} AI recipes`);
            }

            return recipes;
        } catch (error) {
            const recipeError = RecipeErrorHandler.handleError(error, 'AI recipe generation');
            RecipeErrorHandler.logError(recipeError);
            return [];
        }
    }

    /**
     * Queue background recipe generation for cache warming
     */
    private queueBackgroundGeneration(ingredients: string[], limit: number): void {
        this.backgroundQueue.push({ ingredients, limit });
        this.processBackgroundQueue();
    }

    /**
     * Process background generation queue
     */
    private async processBackgroundQueue(): Promise<void> {
        if (this.isProcessingBackground || this.backgroundQueue.length === 0) {
            return;
        }

        this.isProcessingBackground = true;

        try {
            while (this.backgroundQueue.length > 0) {
                const { ingredients, limit } = this.backgroundQueue.shift()!;

                console.log('Background generating recipes for:', ingredients.slice(0, 3));
                await this.getAIGeneratedRecipes(ingredients, limit);

                // Small delay to avoid overwhelming the API
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.warn('Background generation failed:', error);
        } finally {
            this.isProcessingBackground = false;
        }
    }

    /**
     * Apply translations if needed (extracted for reuse)
     */
    private async applyTranslationsIfNeeded(recipes: Recipe[]): Promise<Recipe[]> {
        if (i18n.language === 'es') {
            return Promise.all(recipes.map((r: Recipe) => translationService.translateRecipe(r, 'es')));
        }
        return recipes;
    }

    /**
     * Get default recipes for users without inventory items
     */
    private getDefaultRecipesForUser(limit: number): Recipe[] {
        // Get a mix of recipes across different meal times
        const currentHour = new Date().getHours();
        let mealTime = 'dinner'; // Default

        if (currentHour >= 6 && currentHour < 11) {
            mealTime = 'breakfast';
        } else if (currentHour >= 11 && currentHour < 17) {
            mealTime = 'lunch';
        } else if (currentHour >= 17 && currentHour < 22) {
            mealTime = 'dinner';
        }

        // Get recipes suitable for current time, but include variety
        const mealTimeRecipes = defaultRecipeLoader.getDefaultRecipesForMealTime(mealTime, Math.ceil(limit * 0.6));
        const randomRecipes = defaultRecipeLoader.getRandomDefaultRecipes(Math.ceil(limit * 0.4));

        // Combine and remove duplicates
        const allRecipes = [...mealTimeRecipes, ...randomRecipes];
        const uniqueRecipes = allRecipes.filter((recipe, index, self) =>
            index === self.findIndex(r => r.id === recipe.id)
        );

        return uniqueRecipes.slice(0, limit);
    }

    /**
     * Search recipes - works with both default and AI-generated
     */
    async searchRecipes(query: string, limit: number = 10): Promise<Recipe[]> {
        try {
            // For now, search only in default recipes
            // In the future, we could implement AI-powered recipe search
            const results = defaultRecipeLoader.searchDefaultRecipes(query, limit);

            // Apply translations if language is Spanish
            if (i18n.language === 'es') {
                return Promise.all(results.map((r: Recipe) => translationService.translateRecipe(r, 'es')));
            }

            return results;
        } catch (error) {
            console.error('Error searching recipes:', error);
            return [];
        }
    }

    /**
     * Prefetch recipes for common ingredient combinations
     */
    async prefetchCommonRecipes(): Promise<void> {
        const commonCombinations = [
            ['chicken', 'rice', 'vegetables'],
            ['pasta', 'tomato', 'cheese'],
            ['beef', 'potatoes', 'onion'],
            ['fish', 'lemon', 'herbs'],
            ['eggs', 'bread', 'milk']
        ];

        console.log('Prefetching common recipe combinations...');

        for (const ingredients of commonCombinations) {
            this.queueBackgroundGeneration(ingredients, 5);
        }
    }

    /**
     * Clear all caches including persistent storage
     */
    async clearCache(): Promise<void> {
        this.recipeCache.clear();
        this.cacheExpiry.clear();
        this.fullRecipeCache.clear();

        try {
            await AsyncStorage.removeItem(this.PERSISTENT_CACHE_KEY);
        } catch (error) {
            console.warn('Failed to clear persistent cache:', error);
        }

        console.log('All recipe caches cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; keys: string[]; fullRecipeCount: number; persistent: boolean } {
        return {
            size: this.recipeCache.size,
            keys: Array.from(this.recipeCache.keys()),
            fullRecipeCount: this.fullRecipeCache.size,
            persistent: true
        };
    }
}

export const recipeService = RecipeService.instance; 