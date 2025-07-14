import i18n from '../localization/i18n';
import { Recipe, recipeFromDetailedJson, recipeFromJson } from '../models/RecipeModel';
import { translationService } from './TranslationService';

const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

class RecipeService {
    private static _instance: RecipeService;
    static get instance() {
        if (!this._instance) this._instance = new RecipeService();
        return this._instance;
    }
    private constructor() { }

    async getRecipesByIngredients(ingredients: string[], limit: number = 20): Promise<Recipe[]> {
        if (!SPOONACULAR_API_KEY) {
            throw new Error('Spoonacular API key is missing. Ensure .env is loaded and the key is defined.');
        }

        if (ingredients.length === 0) {
            return [];
        }

        const ingredientsString = ingredients.join(',');
        const url = `${BASE_URL}/findByIngredients?ingredients=${ingredientsString}&number=${limit}&ranking=2`;

        try {
            const response = await fetch(url, {
                headers: {
                    'x-api-key': SPOONACULAR_API_KEY,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load recipes: ${response.status}`);
            }

            const data = await response.json();
            const recipes = data.map(recipeFromJson);

            if (i18n.language === 'es') {
                return Promise.all(recipes.map((r: Recipe) => translationService.translateRecipe(r, 'es')));
            }

            return recipes;
        } catch (error) {
            console.error('Error fetching recipes by ingredients:', error);
            throw error;
        }
    }

    async getRecipesInformationBulk(ids: number[]): Promise<Recipe[]> {
        if (!SPOONACULAR_API_KEY) {
            throw new Error('Spoonacular API key is missing from .env');
        }

        if (ids.length === 0) {
            return [];
        }

        const url = `${BASE_URL}/informationBulk?ids=${ids.join(',')}&apiKey=${SPOONACULAR_API_KEY}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to load recipe details. Status: ${response.status}`);
            }

            const data = await response.json();
            const recipes = data.map(recipeFromDetailedJson);

            if (i18n.language === 'es') {
                return Promise.all(recipes.map((r: Recipe) => translationService.translateRecipe(r, 'es')));
            }

            return recipes;
        } catch (error) {
            console.error('Error fetching recipe details:', error);
            throw error;
        }
    }
}

export const recipeService = RecipeService.instance; 