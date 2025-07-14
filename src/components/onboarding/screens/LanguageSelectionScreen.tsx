import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { storeLanguage } from '../../../localization/i18n';
import { OnboardingScreenProps } from '../OnboardingScreen';

interface LanguageOption {
    code: string;
    name: string;
    nativeName: string;
    flag: string;
}

const languages: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
];

export default function LanguageSelectionScreen(props: OnboardingScreenProps) {
    const { t, i18n } = useTranslation();
    const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language || 'en');

    const handleLanguageSelect = async (languageCode: string) => {
        setSelectedLanguage(languageCode);
        try {
            // Change the active language in i18n
            await i18n.changeLanguage(languageCode);
            // Store the language for persistence
            await storeLanguage(languageCode);
            console.log('Language changed and stored successfully:', languageCode);
        } catch (error) {
            console.error('Error changing/storing language:', error);
        }
    };

    const renderLanguageOptions = () => (
        <View style={styles.languageContainer}>
            {languages.map((language) => (
                <Pressable
                    key={language.code}
                    style={[
                        styles.languageOption,
                        selectedLanguage === language.code && styles.languageOptionSelected
                    ]}
                    onPress={() => handleLanguageSelect(language.code)}
                >
                    <View style={styles.languageContent}>
                        <Text style={styles.languageFlag}>{language.flag}</Text>
                        <View style={styles.languageText}>
                            <Text style={[
                                styles.languageName,
                                selectedLanguage === language.code && styles.languageNameSelected
                            ]}>
                                {language.name}
                            </Text>
                            <Text style={[
                                styles.languageNative,
                                selectedLanguage === language.code && styles.languageNativeSelected
                            ]}>
                                {language.nativeName}
                            </Text>
                        </View>
                        {selectedLanguage === language.code && (
                            <View style={styles.checkmark}>
                                <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                        )}
                    </View>
                </Pressable>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{t('onboarding_language_title', 'Choose Your Language')}</Text>
                    <Text style={styles.subtitle}>{t('onboarding_language_subtitle', 'Select your preferred language to continue')}</Text>
                </View>

                {renderLanguageOptions()}

                <View style={styles.navigationContainer}>
                    <Pressable
                        style={[styles.continueButton, !selectedLanguage && styles.continueButtonDisabled]}
                        onPress={props.onNext}
                        disabled={!selectedLanguage}
                    >
                        <Text style={[styles.continueButtonText, !selectedLanguage && styles.continueButtonTextDisabled]}>
                            {t('onboarding_continue', 'Continue')}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    textContainer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 28,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 34,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    languageContainer: {
        gap: 16,
        marginVertical: 32,
    },
    languageOption: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.borderColor,
        padding: 20,
    },
    languageOptionSelected: {
        borderColor: Colors.secondaryColor,
        backgroundColor: Colors.secondaryColor + '10',
    },
    languageContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    languageFlag: {
        fontSize: 32,
        marginRight: 16,
    },
    languageText: {
        flex: 1,
    },
    languageName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    languageNameSelected: {
        color: Colors.secondaryColor,
    },
    languageNative: {
        fontFamily: 'Inter-Regular',
        fontSize: 14,
        color: Colors.textSecondary,
    },
    languageNativeSelected: {
        color: Colors.secondaryColor + 'CC',
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.secondaryColor,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkText: {
        color: Colors.backgroundWhite,
        fontSize: 14,
        fontWeight: 'bold',
    },
    navigationContainer: {
        marginTop: 32,
    },
    continueButton: {
        backgroundColor: Colors.secondaryColor,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    continueButtonDisabled: {
        backgroundColor: Colors.borderColor,
    },
    continueButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 18,
        color: Colors.backgroundWhite,
    },
    continueButtonTextDisabled: {
        color: Colors.textTertiary,
    },
}); 