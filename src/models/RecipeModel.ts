export interface Recipe {
    id: number;
    title: string;
    imageUrl: string;
    usedIngredientCount: number;
    missedIngredientCount: number;
    likes: number;

    // Optional detailed fields with defaults
    description: string;
    category: string;
    difficulty: string;
    cookTime: string;
    servings: string;
    primaryIngredient: string;
    isFavorite: boolean;

    // Detailed fields for recipe instructions
    ingredients: Array<{ name: string; amount: string }>;
    instructions: string[];
}

export function recipeFromJson(json: any): Recipe {
    return {
        id: json.id || 0,
        title: json.title || '',
        imageUrl: json.image || '',
        usedIngredientCount: json.usedIngredientCount || 0,
        missedIngredientCount: json.missedIngredientCount || 0,
        likes: json.likes || 0,
        description: json.summary || '',
        category: (json.dishTypes && json.dishTypes.length > 0) ? json.dishTypes[0] : 'General',
        difficulty: json.difficulty || 'Easy',
        cookTime: json.readyInMinutes ? `${json.readyInMinutes} min` : '30 min',
        servings: json.servings ? `${json.servings} servings` : '4 servings',
        primaryIngredient: json.primaryIngredient || '🍅 Tomato',
        isFavorite: json.isFavorite || false,
        ingredients: [],
        instructions: [],
    };
}

export function recipeFromDetailedJson(json: any): Recipe {
    const extractInstructions = (key: string): string[] => {
        if (json[key] && Array.isArray(json[key]) && json[key].length > 0) {
            const steps = json[key][0]?.steps;
            if (Array.isArray(steps)) {
                return steps.map((step: any) => step.step || '').filter(Boolean);
            }
        }
        return [];
    };

    const stripHtmlTags = (html: string): string => {
        return html.replace(/<[^>]*>/g, '');
    };

    return {
        id: json.id || 0,
        title: json.title || 'No Title',
        imageUrl: json.image || '',
        usedIngredientCount: 0, // Not present in detailed endpoint
        missedIngredientCount: 0, // Not present in detailed endpoint
        likes: json.aggregateLikes || 0,
        description: stripHtmlTags(json.summary || ''),
        category: (json.dishTypes && json.dishTypes.length > 0) ? json.dishTypes[0] : 'General',
        difficulty: (json.readyInMinutes || 45) <= 20 ? 'Easy' : (json.readyInMinutes || 45) <= 45 ? 'Medium' : 'Hard',
        cookTime: `${json.readyInMinutes || '?'} min`,
        servings: `${json.servings || '?'} servings`,
        isFavorite: false,
        primaryIngredient: (json.extendedIngredients && json.extendedIngredients.length > 0)
            ? json.extendedIngredients[0].name : '',
        ingredients: (json.extendedIngredients || []).map((ing: any) => ({
            name: ing.name?.toString() || 'Unknown Ingredient',
            amount: `${ing.amount} ${ing.unit}`,
        })),
        instructions: extractInstructions('analyzedInstructions'),
    };
}

export function getCategoryColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
        case 'dessert':
            return '#EF4444';
        case 'breakfast':
            return '#F59E0B';
        case 'salad':
            return '#10B981';
        default:
            return '#3B82F6';
    }
}

export function getEmojiForIngredient(ingredient: string): string {
    const name = ingredient.toLowerCase();

    if (name.includes('dairy') || name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) return '🥛';
    if (name.includes('fruit') || name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('berry')) return '🍎';
    if (name.includes('vegetable') || name.includes('lettuce') || name.includes('spinach') || name.includes('carrot') || name.includes('tomato') || name.includes('onion') || name.includes('garlic')) return '🥬';
    if (name.includes('meat') || name.includes('chicken') || name.includes('beef') || name.includes('pork')) return '🍗';
    if (name.includes('bakery') || name.includes('bread') || name.includes('baked') || name.includes('flour')) return '🍞';
    if (name.includes('pantry') || name.includes('pasta') || name.includes('rice') || name.includes('cereal') || name.includes('sauce')) return '🥫';
    if (name.includes('beverage') || name.includes('drink') || name.includes('juice')) return '🥤';
    if (name.includes('snack') || name.includes('chip') || name.includes('cookie')) return '🍪';
    if (name.includes('frozen')) return '🧊';
    if (name.includes('oil') || name.includes('vinegar')) return '🫒';
    if (name.includes('sugar') || name.includes('honey') || name.includes('syrup')) return '🍯';
    if (name.includes('butter')) return '🧈';
    if (name.includes('egg')) return '🥚';
    if (name.includes('spice') || name.includes('herb') || name.includes('salt') || name.includes('pepper')) return '🧂';

    return '🥣'; // Default fallback
} 