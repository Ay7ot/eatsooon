import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
    const { t, i18n } = useI18nTranslation();

    return {
        t,
        i18n,
        currentLanguage: i18n.language,
        isReady: i18n.isInitialized,
    };
};

export default useTranslation; 