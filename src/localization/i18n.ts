import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './translations/en.json';
import es from './translations/es.json';

const LANGUAGE_STORAGE_KEY = 'user_language';

// Get device language
const getDeviceLanguage = (): string => {
    const locales = Localization.getLocales();
    if (Array.isArray(locales) && locales.length > 0) {
        return locales[0].languageCode ?? 'en';
    }
    return 'en';
};

// Get stored language preference
const getStoredLanguage = async (): Promise<string> => {
    try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (storedLanguage) {
            return storedLanguage;
        }
        return getDeviceLanguage();
    } catch (error) {
        console.warn('Error getting stored language:', error);
        return getDeviceLanguage();
    }
};

// Store language preference
export const storeLanguage = async (language: string) => {
    try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
        console.warn('Error storing language:', error);
    }
};

// Initialize i18n
const initI18n = async () => {
    const storedLanguage = await getStoredLanguage();

    i18n
        .use(initReactI18next)
        .init({
            lng: storedLanguage,
            fallbackLng: 'en',
            debug: __DEV__,

            resources: {
                en: {
                    translation: en,
                },
                es: {
                    translation: es,
                },
            },

            interpolation: {
                escapeValue: false,
            },

            react: {
                useSuspense: false,
            },
        });
};

// Initialize on app start
initI18n();

export default i18n; 