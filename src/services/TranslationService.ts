// src/services/TranslationService.ts

// A mock translation service. In a real application, this would
// use a service like Google Translate, DeepL, or an AI model.

class TranslationService {
    private static _instance: TranslationService;
    static get instance() {
        if (!this._instance) this._instance = new TranslationService();
        return this._instance;
    }
    private constructor() { }

    /**
     * Translates text to the target language.
     * This is a mock implementation.
     * @param text The text to translate.
     * @param targetLanguage The language to translate to (e.g., 'es').
     * @returns The translated text.
     */
    async translate(text: string | undefined | null, targetLanguage: string): Promise<string> {
        if (!text) return '';
        if (!process.env.EXPO_OPENAI_API_KEY) {
            console.warn('OpenAI API key missing. Returning original text.');
            return text;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.EXPO_OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a translation engine that translates English recipe text into ${targetLanguage}. Return ONLY the translated text without additional commentary.`,
                        },
                        {
                            role: 'user',
                            content: text,
                        },
                    ],
                    temperature: 0.2,
                    max_tokens: 800,
                }),
            });

            if (!response.ok) {
                console.warn('OpenAI translation failed:', await response.text());
                return text; // Fallback to original
            }

            const json = await response.json();
            const translated = json?.choices?.[0]?.message?.content?.trim();
            return translated || text;
        } catch (error) {
            console.warn('OpenAI translation error', error);
            return text; // Fallback on error
        }
    }

    async translateRecipe(recipe: any, targetLanguage: string): Promise<any> {
        if (!recipe) return null;

        const [
            translatedTitle,
            translatedDescription,
            translatedInstructions,
            translatedIngredients
        ] = await Promise.all([
            this.translate(recipe.title, targetLanguage),
            this.translate(recipe.description, targetLanguage),
            Promise.all(recipe.instructions.map((inst: string) => this.translate(inst, targetLanguage))),
            Promise.all(recipe.ingredients.map(async (ing: any) => ({
                ...ing,
                name: await this.translate(ing.name, targetLanguage)
            })))
        ]);


        return {
            ...recipe,
            title: translatedTitle,
            description: translatedDescription,
            instructions: translatedInstructions,
            ingredients: translatedIngredients,
            isTranslated: true,
        };
    }
}

export const translationService = TranslationService.instance; 