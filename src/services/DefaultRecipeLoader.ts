import { Recipe } from '../models/RecipeModel';
import defaultRecipesData from '../data/defaultRecipes.json';

class DefaultRecipeLoader {
    private static _instance: DefaultRecipeLoader;
    static get instance() {
        if (!this._instance) this._instance = new DefaultRecipeLoader();
        return this._instance;
    }
    private constructor() { }

    private _defaultRecipes: Recipe[] | null = null;

    /**
     * Get all default recipes from the JSON file
     * @returns Array of default Recipe objects
     */
    getDefaultRecipes(): Recipe[] {
        if (this._defaultRecipes === null) {
            this._defaultRecipes = this.loadAndValidateRecipes();
        }
        return this._defaultRecipes;
    }

    /**
     * Get a specific number of random default recipes
     * @param count Number of recipes to return
     * @returns Array of randomly selected Recipe objects
     */
    getRandomDefaultRecipes(count: number): Recipe[] {
        const allRecipes = this.getDefaultRecipes();
        
        if (count >= allRecipes.length) {
            return [...allRecipes];
        }

        // Shuffle array and take first 'count' items
        const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Get default recipes filtered by category
     * @param category Recipe category to filter by
     * @param count Maximum number of recipes to return (optional)
     * @returns Array of Recipe objects matching the category
     */
    getDefaultRecipesByCategory(category: string, count?: number): Recipe[] {
        const allRecipes = this.getDefaultRecipes();
        const filtered = allRecipes.filter(recipe => 
            recipe.category.toLowerCase() === category.toLowerCase()
        );

        if (count && count < filtered.length) {
            return filtered.slice(0, count);
        }

        return filtered;
    }

    /**
     * Get default recipes suitable for a specific meal time
     * @param mealTime 'breakfast', 'lunch', 'dinner', or 'dessert'
     * @param count Maximum number of recipes to return
     * @returns Array of Recipe objects suitable for the meal time
     */
    getDefaultRecipesForMealTime(mealTime: string, count: number = 5): Recipe[] {
        const mealCategories: { [key: string]: string[] } = {
            breakfast: ['breakfast'],
            lunch: ['lunch', 'salad', 'soup'],
            dinner: ['dinner', 'soup'],
            dessert: ['dessert'],
            snack: ['appetizer', 'salad']
        };

        const categories = mealCategories[mealTime.toLowerCase()] || ['dinner'];
        const allRecipes = this.getDefaultRecipes();
        
        const suitableRecipes = allRecipes.filter(recipe => 
            categories.includes(recipe.category.toLowerCase())
        );

        // If we don't have enough recipes for this meal time, add some general ones
        if (suitableRecipes.length < count) {
            const generalRecipes = allRecipes.filter(recipe => 
                !categories.includes(recipe.category.toLowerCase())
            );
            suitableRecipes.push(...generalRecipes.slice(0, count - suitableRecipes.length));
        }

        return suitableRecipes.slice(0, count);
    }

    private loadAndValidateRecipes(): Recipe[] {
        try {
            // Type assertion since we know the structure of our JSON
            const recipes = defaultRecipesData as Recipe[];
            
            // Validate each recipe has required fields
            return recipes.map((recipe, index) => this.validateRecipe(recipe, index));
        } catch (error) {
            console.error('Error loading default recipes:', error);
            return [];
        }
    }

    private validateRecipe(recipe: any, index: number): Recipe {
        // Ensure all required fields are present with fallback values
        return {
            id: recipe.id || (1000 + index),
            title: recipe.title || `Recipe ${index + 1}`,
            imageUrl: recipe.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            usedIngredientCount: recipe.usedIngredientCount || 0,
            missedIngredientCount: recipe.missedIngredientCount || 0,
            likes: recipe.likes || 100,
            description: recipe.description || 'A delicious recipe.',
            category: recipe.category || 'dinner',
            difficulty: recipe.difficulty || 'Medium',
            cookTime: recipe.cookTime || '30 min',
            servings: recipe.servings || '4 servings',
            primaryIngredient: recipe.primaryIngredient || '🍽️ Mixed',
            isFavorite: recipe.isFavorite || false,
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
            instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        };
    }

    /**
     * Search default recipes by title or ingredients
     * @param query Search query
     * @param count Maximum number of results
     * @returns Array of matching Recipe objects
     */
    searchDefaultRecipes(query: string, count: number = 10): Recipe[] {
        if (!query.trim()) {
            return this.getRandomDefaultRecipes(count);
        }

        const allRecipes = this.getDefaultRecipes();
        const searchTerm = query.toLowerCase().trim();

        const matches = allRecipes.filter(recipe => {
            // Search in title
            if (recipe.title.toLowerCase().includes(searchTerm)) {
                return true;
            }

            // Search in ingredients
            return recipe.ingredients.some(ingredient => 
                ingredient.name.toLowerCase().includes(searchTerm)
            );
        });

        return matches.slice(0, count);
    }
}

export const defaultRecipeLoader = DefaultRecipeLoader.instance; 