export interface RecipeError {
    type: 'ai_generation' | 'loading' | 'translation' | 'network' | 'unknown';
    message: string;
    userMessage: string;
    originalError?: any;
}

export class RecipeErrorHandler {
    static handleError(error: any, context: string): RecipeError {
        console.error(`Recipe error in ${context}:`, error);

        // Network-related errors
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
            return {
                type: 'network',
                message: `Network error in ${context}: ${error.message}`,
                userMessage: 'Unable to connect to recipe service. Please check your internet connection.',
                originalError: error
            };
        }

        // OpenAI API errors
        if (error.message?.includes('OpenAI') || error.message?.includes('API error')) {
            return {
                type: 'ai_generation',
                message: `AI generation error in ${context}: ${error.message}`,
                userMessage: 'Recipe generation is temporarily unavailable. Showing default recipes instead.',
                originalError: error
            };
        }

        // Translation errors
        if (context.includes('translation') || error.message?.includes('translation')) {
            return {
                type: 'translation',
                message: `Translation error in ${context}: ${error.message}`,
                userMessage: 'Recipe translation failed. Showing recipes in English.',
                originalError: error
            };
        }

        // JSON parsing or loading errors
        if (error.message?.includes('JSON') || error.message?.includes('parse')) {
            return {
                type: 'loading',
                message: `Data loading error in ${context}: ${error.message}`,
                userMessage: 'Unable to load recipe data. Please try again.',
                originalError: error
            };
        }

        // Default unknown error
        return {
            type: 'unknown',
            message: `Unknown error in ${context}: ${error.message || error}`,
            userMessage: 'Something went wrong while loading recipes. Please try again.',
            originalError: error
        };
    }

    static logError(error: RecipeError): void {
        console.error(`[Recipe Error] ${error.type}: ${error.message}`);

        // In a production app, you might want to send this to a crash reporting service
        // like Sentry, Crashlytics, etc.
        if (error.type === 'ai_generation' || error.type === 'network') {
            // These are important errors that should be tracked
            console.warn('Important recipe error that should be monitored:', error);
        }
    }

    static getRetryableErrorTypes(): string[] {
        return ['network', 'ai_generation', 'loading'];
    }

    static isRetryable(error: RecipeError): boolean {
        return this.getRetryableErrorTypes().includes(error.type);
    }
}

// Error messages for different languages
export const errorMessages = {
    en: {
        network: 'Unable to connect to recipe service. Please check your internet connection.',
        ai_generation: 'Recipe generation is temporarily unavailable. Showing default recipes instead.',
        translation: 'Recipe translation failed. Showing recipes in English.',
        loading: 'Unable to load recipe data. Please try again.',
        unknown: 'Something went wrong while loading recipes. Please try again.',
        retry: 'Retry',
        fallback: 'Using default recipes'
    },
    es: {
        network: 'No se puede conectar al servicio de recetas. Verifique su conexión a internet.',
        ai_generation: 'La generación de recetas no está disponible temporalmente. Mostrando recetas predeterminadas.',
        translation: 'Error al traducir recetas. Mostrando recetas en inglés.',
        loading: 'No se pueden cargar los datos de recetas. Inténtelo de nuevo.',
        unknown: 'Algo salió mal al cargar las recetas. Inténtelo de nuevo.',
        retry: 'Reintentar',
        fallback: 'Usando recetas predeterminadas'
    }
};

export function getErrorMessage(error: RecipeError, language: string = 'en'): string {
    const messages = errorMessages[language as keyof typeof errorMessages] || errorMessages.en;
    return messages[error.type as keyof typeof messages] || messages.unknown;
} 