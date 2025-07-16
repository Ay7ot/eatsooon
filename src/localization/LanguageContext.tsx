import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { recipeService } from '../services/RecipeService';
import { storeLanguage } from './i18n';
// expo-localization already handles device locale; react-native-localize not needed

interface LanguageContextType {
    currentLanguage: string;
    changeLanguage: (language: string) => Promise<void>;
    availableLanguages: { code: string; name: string; nativeName: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

    const availableLanguages = [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'es', name: 'Spanish', nativeName: 'Español' },
    ];

    useEffect(() => {
        const handleLanguageChange = (language: string) => {
            setCurrentLanguage(language);
        };

        i18n.on('languageChanged', handleLanguageChange);

        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [i18n]);

    const changeLanguage = async (language: string) => {
        try {
            await i18n.changeLanguage(language);
            await storeLanguage(language);
            setCurrentLanguage(language);

            // Clear recipe cache to ensure fresh recipes are generated in the new language
            await recipeService.clearCacheForLanguageChange();

            console.log(`Language changed to: ${language}`);
        } catch (error) {
            console.warn('Error changing language:', error);
        }
    };

    const value: LanguageContextType = {
        currentLanguage,
        changeLanguage,
        availableLanguages,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}; 