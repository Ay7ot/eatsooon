import { Recipe } from '../models/RecipeModel';

class AIRecipeService {
    private static _instance: AIRecipeService;
    static get instance() {
        if (!this._instance) this._instance = new AIRecipeService();
        return this._instance;
    }
    private constructor() { }

    /**
     * Preprocesses ingredient names to extract key terms for better recipe matching
     */
    private preprocessIngredients(ingredients: string[]): string[] {
        return ingredients.map(ingredient => {
            let processed = ingredient.toLowerCase().trim();

            // Remove brand names and specific product details
            processed = processed
                .replace(/^(yellow label|green label|red label|blue label)\s+/i, '') // Remove color labels
                .replace(/\b(brand|organic|fresh|frozen|canned|dried)\b/gi, '') // Remove descriptors
                .replace(/\b(whole|skim|2%|low fat|fat free)\b/gi, '') // Remove fat content descriptors
                .replace(/\b(extra virgin|virgin|refined)\b/gi, '') // Remove oil types
                .replace(/\b(sea|table|kosher|himalayan)\b/gi, '') // Remove salt types
                .replace(/&\s*(almond|raisin|cranberry|chocolate)\b.*$/i, '') // Extract main item from combinations like "granola & almonds"
                .replace(/\s+with\s+.*$/i, '') // Remove "with X" descriptions
                .replace(/\s*\([^)]*\)/g, '') // Remove parenthetical descriptions
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

            // Handle specific cases
            if (processed.includes('tea')) processed = 'tea';
            if (processed.includes('coffee')) processed = 'coffee';
            if (processed.includes('bread')) processed = 'bread';
            if (processed.includes('milk')) processed = 'milk';
            if (processed.includes('cheese')) processed = 'cheese';
            if (processed.includes('yogurt')) processed = 'yogurt';
            if (processed.includes('butter')) processed = 'butter';
            if (processed.includes('oil')) processed = 'oil';
            if (processed.includes('vinegar')) processed = 'vinegar';
            if (processed.includes('salt')) processed = 'salt';
            if (processed.includes('sugar')) processed = 'sugar';
            if (processed.includes('flour')) processed = 'flour';
            if (processed.includes('rice')) processed = 'rice';
            if (processed.includes('pasta')) processed = 'pasta';
            if (processed.includes('chicken')) processed = 'chicken';
            if (processed.includes('beef')) processed = 'beef';
            if (processed.includes('pork')) processed = 'pork';
            if (processed.includes('fish')) processed = 'fish';
            if (processed.includes('granola')) processed = 'granola';

            return processed || ingredient; // Return original if processing results in empty string
        }).filter(ingredient => ingredient.length > 0);
    }

    async generateRecipes(ingredients: string[], count: number = 10): Promise<Recipe[]> {
        if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
            console.warn('OpenAI API key missing. Cannot generate recipes.');
            return [];
        }

        if (ingredients.length === 0) {
            return [];
        }

        // Preprocess ingredients for better matching
        const processedIngredients = this.preprocessIngredients(ingredients);
        const uniqueIngredients = [...new Set(processedIngredients)]; // Remove duplicates
        const ingredientsList = uniqueIngredients.slice(0, 8).join(', '); // Limit to 8 ingredients for better results

        console.log('Original ingredients:', ingredients);
        console.log('Processed ingredients:', uniqueIngredients);

        const systemPrompt = `You are a professional chef and recipe creator. Generate creative and realistic recipes using the provided ingredients. Each recipe must be returned as a valid JSON object matching this exact structure:

{
  "id": number (use sequential IDs starting from 2001),
  "title": "string",
  "imageUrl": "https://images.unsplash.com/photo-[use food-related photo IDs]?w=400",
  "usedIngredientCount": number (count of provided ingredients actually used in this recipe),
  "missedIngredientCount": number (count of additional ingredients needed beyond provided ones),
  "likes": number (realistic number between 50-800),
  "description": "string (2-3 sentences describing the dish)",
  "category": "string (breakfast/lunch/dinner/dessert/appetizer/soup/salad)",
  "difficulty": "string (Easy/Medium/Hard)",
  "cookTime": "string (e.g., '25 min')",
  "servings": "string (e.g., '4 servings')",
  "primaryIngredient": "string (emoji + main ingredient, e.g., '🍅 Tomato')",
  "isFavorite": false,
  "ingredients": [{"name": "string", "amount": "string"}],
  "instructions": ["string array of clear cooking steps"]
}

IMPORTANT: Calculate usedIngredientCount and missedIngredientCount accurately:
- usedIngredientCount: count how many of the provided ingredients (${uniqueIngredients.join(', ')}) are actually used in each recipe
- missedIngredientCount: count additional ingredients needed that are NOT in the provided list

Return ONLY a valid JSON array of ${count} recipes. Do not include any other text or formatting.`;

        const userPrompt = `Create ${count} diverse recipes using these available ingredients: ${ingredientsList}. 
        
Make sure each recipe:
- Uses at least 2-3 of the provided ingredients when possible
- Accurately counts used vs missed ingredients
- Includes realistic additional ingredients if needed
- Has clear, step-by-step instructions
- Uses appropriate cooking times and serving sizes
- Has diverse categories and difficulty levels
- Uses real Unsplash photo IDs for food images
- Prioritizes recipes that use more of the available ingredients`;

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // Faster and cheaper than gpt-4
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: 3000, // Reduced from 4000
                    temperature: 0.7, // Slightly more consistent
                }),
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content?.trim();

            if (!content) {
                throw new Error('No content received from OpenAI');
            }

            // Clean and parse the JSON response - handle markdown code blocks and extra text
            const cleanedContent = this.extractJSON(content);
            const recipes = JSON.parse(cleanedContent) as Recipe[];

            // Validate and fix recipes, calculating ingredient counts properly
            return recipes.map((recipe, index) =>
                this.validateAndFixRecipe(recipe, index + 2001, uniqueIngredients)
            );

        } catch (error) {
            console.error('Error generating recipes with OpenAI:', error);
            return [];
        }
    }

    /**
     * Extracts clean JSON from OpenAI response that might be wrapped in markdown or have extra text
     */
    private extractJSON(content: string): string {
        // Remove markdown code block markers
        let cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*$/g, '');

        // Find the first [ and last ] to extract just the JSON array
        const startIndex = cleaned.indexOf('[');
        const lastIndex = cleaned.lastIndexOf(']');

        if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
            cleaned = cleaned.substring(startIndex, lastIndex + 1);
        }

        // Remove any extra text before/after the JSON
        cleaned = cleaned.trim();

        return cleaned;
    }

    private validateAndFixRecipe(recipe: any, fallbackId: number, availableIngredients: string[]): Recipe {
        // Calculate accurate ingredient counts if not provided correctly
        let usedCount = recipe.usedIngredientCount || 0;
        let missedCount = recipe.missedIngredientCount || 0;

        if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
            const recipeIngredientNames = recipe.ingredients.map((ing: any) =>
                (ing.name || '').toLowerCase().trim()
            );

            // Count how many available ingredients are actually used
            usedCount = availableIngredients.filter(available =>
                recipeIngredientNames.some((recipeIng: string) =>
                    recipeIng.includes(available) || available.includes(recipeIng)
                )
            ).length;

            // Missed count is total recipe ingredients minus used ones
            missedCount = Math.max(0, recipe.ingredients.length - usedCount);
        }

        // Ensure all required fields are present with fallback values
        return {
            id: recipe.id || fallbackId,
            title: recipe.title || 'Generated Recipe',
            imageUrl: recipe.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
            usedIngredientCount: usedCount,
            missedIngredientCount: missedCount,
            likes: recipe.likes || Math.floor(Math.random() * 400) + 100,
            description: recipe.description || 'A delicious recipe generated just for you.',
            category: recipe.category || 'dinner',
            difficulty: recipe.difficulty || 'Medium',
            cookTime: recipe.cookTime || '30 min',
            servings: recipe.servings || '4 servings',
            primaryIngredient: recipe.primaryIngredient || '🍽️ Mixed Ingredients',
            isFavorite: false,
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
            instructions: Array.isArray(recipe.instructions) ? recipe.instructions : ['Follow basic cooking instructions for this recipe.'],
        };
    }
}

export const aiRecipeService = AIRecipeService.instance; 