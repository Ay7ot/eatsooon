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

            // Remove brand names and specific product details, but be more conservative
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

            // Handle specific cases - be more specific to preserve user's actual items
            if (processed.includes('tea') && !processed.includes('green tea') && !processed.includes('black tea')) processed = 'tea';
            if (processed.includes('coffee')) processed = 'coffee';
            if (processed.includes('bread') && !processed.includes('whole wheat') && !processed.includes('sourdough')) processed = 'bread';
            if (processed.includes('milk') && !processed.includes('almond milk') && !processed.includes('soy milk')) processed = 'milk';
            if (processed.includes('cheese') && !processed.includes('cheddar') && !processed.includes('mozzarella')) processed = 'cheese';
            if (processed.includes('yogurt')) processed = 'yogurt';
            if (processed.includes('butter')) processed = 'butter';
            if (processed.includes('oil') && !processed.includes('olive oil') && !processed.includes('coconut oil')) processed = 'oil';
            if (processed.includes('vinegar')) processed = 'vinegar';
            if (processed.includes('salt')) processed = 'salt';
            if (processed.includes('sugar')) processed = 'sugar';
            if (processed.includes('flour') && !processed.includes('whole wheat flour')) processed = 'flour';
            if (processed.includes('rice') && !processed.includes('brown rice') && !processed.includes('white rice')) processed = 'rice';
            if (processed.includes('pasta') && !processed.includes('spaghetti') && !processed.includes('penne')) processed = 'pasta';
            if (processed.includes('chicken') && !processed.includes('chicken breast') && !processed.includes('chicken thigh')) processed = 'chicken';
            if (processed.includes('beef') && !processed.includes('ground beef') && !processed.includes('beef steak')) processed = 'beef';
            if (processed.includes('pork')) processed = 'pork';
            if (processed.includes('fish') && !processed.includes('salmon') && !processed.includes('tuna')) processed = 'fish';
            if (processed.includes('granola')) processed = 'granola';

            return processed || ingredient; // Return original if processing results in empty string
        }).filter(ingredient => ingredient.length > 0);
    }

    async generateRecipes(ingredients: string[], count: number = 7, isExpiringSoon: boolean = false, language: string = 'en'): Promise<Recipe[]> {
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
        console.log('Using expiring items:', isExpiringSoon);
        console.log('Generating recipes in language:', language);

        // Try with the requested count first, then fallback to fewer recipes if needed
        const attempts = [count, Math.max(3, Math.floor(count * 0.6))];

        for (const attemptCount of attempts) {
            try {
                console.log(`Attempting to generate ${attemptCount} recipes...`);
                const recipes = await this.attemptGenerateRecipes(ingredientsList, attemptCount, isExpiringSoon, uniqueIngredients, language);
                if (recipes.length > 0) {
                    console.log(`Successfully generated ${recipes.length} recipes`);
                    return recipes;
                }
            } catch (error) {
                console.warn(`Failed to generate ${attemptCount} recipes:`, error);
                if (attemptCount <= 3) {
                    // If we can't even generate 3 recipes, something is seriously wrong
                    console.error('All recipe generation attempts failed');
                    return [];
                }
            }
        }

        return [];
    }

    private async attemptGenerateRecipes(ingredientsList: string, count: number, isExpiringSoon: boolean, uniqueIngredients: string[], language: string): Promise<Recipe[]> {
        const languageInstruction = language === 'es' ?
            'IMPORTANT: Generate all recipe content in Spanish. All titles, descriptions, ingredients, and instructions must be in Spanish.' :
            'IMPORTANT: Generate all recipe content in English. All titles, descriptions, ingredients, and instructions must be in English.';

        const systemPrompt = `You are a professional chef and recipe creator. Generate creative and realistic recipes using the provided ingredients. ${languageInstruction}

Each recipe must be returned as a valid JSON object matching this exact structure:

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

CRITICAL REQUIREMENTS:
1. Each recipe MUST use MOST of the provided ingredients: ${uniqueIngredients.join(', ')}. Do not add recipes that only use 1 or 2 of the items.
2. Prioritize recipes that use MORE of the provided ingredients.
3. Calculate usedIngredientCount and missedIngredientCount accurately:
   - usedIngredientCount: count how many of the provided ingredients are actually used in each recipe
   - missedIngredientCount: count additional ingredients needed that are NOT in the provided list
4. Focus on recipes where the provided ingredients are the MAIN components, not just minor additions
5. If ingredients are expiring soon, prioritize quick, simple recipes that can be made immediately

Return ONLY a valid JSON array of ${count} recipes. Do not include any other text or formatting.`;

        const urgencyNote = isExpiringSoon ?
            `\n\nURGENT: These ingredients are expiring soon (within 3 days). Prioritize recipes that use these ingredients effectively to prevent food waste. Focus on recipes that can be made quickly and use the maximum number of provided ingredients.` : '';

        const userPrompt = `Create ${count} diverse recipes using these available ingredients: ${ingredientsList}.${urgencyNote}
        
CRITICAL REQUIREMENTS:
- Each recipe MUST use at least 2-3 of the provided ingredients as MAIN components
- Prioritize recipes that use MORE of the provided ingredients
- Focus on recipes where the provided ingredients are the star of the dish, not just minor additions
- Accurately count used vs missed ingredients
- Include realistic additional ingredients if needed
- Use clear, step-by-step instructions
- Use appropriate cooking times and serving sizes
- Use diverse categories and difficulty levels
- Use real Unsplash photo IDs for food images
- ${isExpiringSoon ? 'Focus on quick, simple recipes that can be made with expiring ingredients' : ''}
- ${languageInstruction}

Make sure the provided ingredients are the primary focus of each recipe, not just optional additions.`;

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
                    max_tokens: 4000, // Increased back to 4000 to ensure complete responses
                    temperature: 0.7, // Slightly more consistent
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('OpenAI API error response:', errorText);
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content?.trim();

            if (!content) {
                console.error('No content received from OpenAI. Full response:', JSON.stringify(data, null, 2));
                throw new Error('No content received from OpenAI');
            }

            console.log('Raw OpenAI response length:', content.length);
            console.log('Raw OpenAI response preview:', content.substring(0, 200) + '...');

            // Clean and parse the JSON response - handle markdown code blocks and extra text
            const cleanedContent = this.extractJSON(content);
            console.log('Cleaned content length:', cleanedContent.length);
            console.log('Cleaned content preview:', cleanedContent.substring(0, 200) + '...');

            if (!cleanedContent || cleanedContent.trim() === '') {
                console.error('No valid JSON found in response. Full content:', content);
                throw new Error('No valid JSON found in OpenAI response');
            }

            const recipes = JSON.parse(cleanedContent) as Recipe[];

            // Validate and fix recipes, calculating ingredient counts properly
            return recipes.map((recipe, index) =>
                this.validateAndFixRecipe(recipe, index + 2001, uniqueIngredients)
            );

        } catch (error) {
            console.error('Error generating recipes with OpenAI:', error);
            if (error instanceof SyntaxError) {
                console.error('JSON parsing failed. This usually means the OpenAI response was incomplete or malformed.');
            }
            throw error; // Re-throw to allow fallback mechanism to work
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
        } else {
            // If no array brackets found, try to find any JSON object
            const objectStartIndex = cleaned.indexOf('{');
            const objectEndIndex = cleaned.lastIndexOf('}');

            if (objectStartIndex !== -1 && objectEndIndex !== -1 && objectEndIndex > objectStartIndex) {
                // Wrap single object in array
                cleaned = '[' + cleaned.substring(objectStartIndex, objectEndIndex + 1) + ']';
            } else {
                console.warn('No valid JSON structure found in response');
                return '';
            }
        }

        // Remove any extra text before/after the JSON
        cleaned = cleaned.trim();

        // Validate that we have a complete JSON structure
        if (!cleaned.startsWith('[') || !cleaned.endsWith(']')) {
            console.warn('Extracted content does not appear to be a valid JSON array');
            return '';
        }

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