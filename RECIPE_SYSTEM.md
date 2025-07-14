# Recipe System Documentation

## Overview

The Eatsooon app features an intelligent recipe system that provides personalized recipe suggestions based on your current inventory. The system uses OpenAI for dynamic recipe generation and includes a curated collection of default recipes.

## Architecture

### Core Components

1. **RecipeService** - Main service that orchestrates recipe fetching
2. **AIRecipeService** - Handles OpenAI-powered recipe generation  
3. **DefaultRecipeLoader** - Manages static recipe collection
4. **TranslationService** - Provides Spanish translations via OpenAI
5. **RecipeErrorHandler** - Comprehensive error handling and fallbacks

### How It Works

#### For Users WITH Inventory Items
```
User Inventory → Extract Ingredients → OpenAI Generation → Translated Recipes
                                            ↓ (if fails)
                                      Default Recipes
```

#### For Users WITHOUT Inventory Items
```
Empty Inventory → Time-based Selection → Default Recipes → Translated Recipes
```

## Key Features

### 🤖 AI-Powered Generation
- Uses OpenAI GPT-4 to create personalized recipes
- Considers user's actual inventory items
- Generates realistic cooking instructions and ingredient lists
- Includes proper nutritional considerations

### 📚 Default Recipe Collection
- 20 curated recipes covering all meal types
- Breakfast, lunch, dinner, desserts, and snacks
- Time-aware suggestions (breakfast recipes in morning, etc.)
- Diverse difficulty levels and cooking times

### 🌍 Multilingual Support
- Automatic Spanish translation for all recipe content
- Translates titles, descriptions, ingredients, and instructions
- Maintains recipe structure and formatting

### 💾 Smart Caching
- 30-minute cache for AI-generated recipes
- Reduces API costs and improves performance
- Automatic cache cleanup and management

### 🛡️ Robust Error Handling
- Graceful fallbacks at every level
- User-friendly error messages in multiple languages
- Automatic retry mechanisms for network errors
- Comprehensive logging for debugging

## Technical Implementation

### Recipe Data Structure

```typescript
interface Recipe {
    id: number;                    // Unique identifier
    title: string;                 // Recipe name
    imageUrl: string;             // Food photo URL
    usedIngredientCount: number;   // Ingredients from user's inventory
    missedIngredientCount: number; // Additional ingredients needed
    likes: number;                // Popularity metric
    description: string;          // Recipe description
    category: string;             // breakfast/lunch/dinner/etc.
    difficulty: string;           // Easy/Medium/Hard
    cookTime: string;             // e.g., "25 min"
    servings: string;             // e.g., "4 servings"
    primaryIngredient: string;    // Main ingredient with emoji
    isFavorite: boolean;          // User favorite status
    ingredients: Array<{          // Detailed ingredient list
        name: string;
        amount: string;
    }>;
    instructions: string[];       // Step-by-step cooking instructions
}
```

### ID Ranges

- **Default Recipes**: 1000-1999 (stored in JSON)
- **AI Generated**: 2000+ (created by OpenAI)

### Environment Variables

```bash
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

## Usage Examples

### Basic Recipe Fetching

```typescript
import { recipeService } from '@/src/services/RecipeService';

// Get recipes based on user's inventory
const ingredients = ['chicken', 'rice', 'broccoli'];
const recipes = await recipeService.getRecipesByIngredients(ingredients, 10);

// Get default recipes (empty inventory)
const defaultRecipes = await recipeService.getRecipesByIngredients([], 10);
```

### Search Functionality

```typescript
// Search through default recipes
const searchResults = await recipeService.searchRecipes('pasta', 5);
```

### Cache Management

```typescript
// Clear recipe cache
recipeService.clearCache();

// Get cache statistics
const stats = recipeService.getCacheStats();
console.log(`Cached recipes: ${stats.size}`);
```

## Performance Considerations

### API Costs
- OpenAI API calls are cached for 30 minutes
- Only generates recipes when user has inventory items
- Falls back to free default recipes on failures

### Loading Times
- Default recipes load instantly from local JSON
- AI generation typically takes 3-5 seconds
- Parallel translation processing for faster results

### Error Recovery
- Multiple fallback layers ensure users always see recipes
- Network failures automatically retry with exponential backoff
- Translation failures gracefully degrade to English

## Translation System

### Supported Languages
- **English** (default)
- **Spanish** (via OpenAI translation)

### Translation Process
1. Recipe generated in English
2. If user language is Spanish, translate all text fields
3. Preserve recipe structure and formatting
4. Cache translated results

### Error Handling
- Translation failures show English version
- User-friendly error messages in both languages
- Automatic fallback to cached translations

## Monitoring and Debugging

### Error Types
- `ai_generation` - OpenAI API failures
- `network` - Network connectivity issues  
- `translation` - Translation service errors
- `loading` - Data parsing/loading errors
- `unknown` - Unexpected errors

### Logging
```typescript
// All errors are automatically logged with context
// Example log output:
[Recipe Error] ai_generation: OpenAI API error in getRecipesByIngredients: 429 rate limit exceeded
```

### User Feedback
```typescript
// Error messages are user-friendly and actionable
"Recipe generation is temporarily unavailable. Showing default recipes instead."
"No se puede conectar al servicio de recetas. Verifique su conexión a internet."
```

## Future Enhancements

### Planned Features
- Recipe favoriting and personal collections
- Dietary restriction filters (vegetarian, gluten-free, etc.)
- Nutrition information integration
- Recipe sharing between family members
- Voice-guided cooking instructions

### Scalability
- Easy integration with additional AI models
- Support for more languages
- Recipe recommendation learning from user preferences
- Integration with grocery delivery services

## Troubleshooting

### Common Issues

**No recipes showing**
- Check internet connection
- Verify OpenAI API key is set correctly
- Clear app cache and restart

**Recipes in wrong language**
- Check app language settings
- Restart app after language change
- Translation may take a few seconds

**AI generation failing**
- Default recipes will automatically load
- Check OpenAI API quota/billing
- Network issues may cause temporary failures

### Support
For technical issues or questions about the recipe system, please check the error logs and refer to this documentation. 