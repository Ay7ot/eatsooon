import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import FamilyScreen from '../src/components/onboarding/screens/FamilyScreen';
import GetStartedScreen from '../src/components/onboarding/screens/GetStartedScreen';
import InventoryScreen from '../src/components/onboarding/screens/InventoryScreen';
import LanguageSelectionScreen from '../src/components/onboarding/screens/LanguageSelectionScreen';
import RecipeScreen from '../src/components/onboarding/screens/RecipeScreen';
import WelcomeScreen from '../src/components/onboarding/screens/WelcomeScreen';
import { onboardingService } from '../src/services/OnboardingService';

const screens = [
    LanguageSelectionScreen,
    WelcomeScreen,
    InventoryScreen,
    FamilyScreen,
    RecipeScreen,
    GetStartedScreen,
];

export default function OnboardingPage() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const router = useRouter();

    const handleNext = () => {
        if (currentIndex < screens.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSkip = () => {
        onboardingService.completeOnboarding();
        router.replace('/(tabs)');
    };

    const handleComplete = () => {
        onboardingService.completeOnboarding();
        router.replace('/(tabs)');
    };

    const CurrentScreen = screens[currentIndex];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <CurrentScreen
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onSkip={handleSkip}
                    currentIndex={currentIndex}
                    totalScreens={screens.length}
                    isFirst={currentIndex === 0}
                    isLast={currentIndex === screens.length - 1}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    content: {
        flex: 1,
    },
}); 