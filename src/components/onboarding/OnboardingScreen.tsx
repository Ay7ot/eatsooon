import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../../constants/Colors';

// Custom Arrow Forward SVG Component
function ArrowForwardIcon({ size = 24, color = Colors.backgroundWhite }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
                d="M5 12h14M12 5l7 7-7 7"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export interface OnboardingScreenProps {
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    currentIndex: number;
    totalScreens: number;
    isFirst: boolean;
    isLast: boolean;
}

interface BaseOnboardingScreenProps extends OnboardingScreenProps {
    title: string;
    subtitle: string;
    illustration: React.ReactNode;
    showSkip?: boolean;
}

export default function OnboardingScreen({
    title,
    subtitle,
    illustration,
    onNext,
    onPrev,
    onSkip,
    currentIndex,
    totalScreens,
    isFirst,
    isLast,
    showSkip = true,
}: BaseOnboardingScreenProps) {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            {/* Skip Button */}
            {showSkip && !isLast && (
                <View style={styles.header}>
                    <Pressable onPress={onSkip} style={styles.skipButton}>
                        <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
                    </Pressable>
                </View>
            )}

            {/* Content */}
            <View style={styles.content}>
                {/* Illustration */}
                <View style={styles.illustrationContainer}>
                    {illustration}
                </View>

                {/* Text Content */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
            </View>

            {/* Bottom Section */}
            <View style={styles.bottom}>
                {/* Progress Indicators */}
                <View style={styles.progressContainer}>
                    {Array.from({ length: totalScreens }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.progressDot,
                                index === currentIndex && styles.progressDotActive,
                            ]}
                        />
                    ))}
                </View>

                {/* Navigation Buttons */}
                <View style={styles.navigationContainer}>
                    {/* Previous Button */}
                    <Pressable
                        onPress={onPrev}
                        style={[styles.navButton, styles.prevButton, isFirst && styles.navButtonDisabled]}
                        disabled={isFirst}
                    >
                        <MaterialIcons
                            name="arrow-back"
                            size={24}
                            color={isFirst ? Colors.textTertiary : Colors.textSecondary}
                        />
                    </Pressable>

                    {/* Next/Finish Buttons */}
                    {isLast ? (
                        <Pressable
                            onPress={onNext}
                            style={styles.getStartedButton}
                        >
                            <Text style={styles.getStartedButtonText}>
                                {t('onboarding_get_started')}
                            </Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={onNext}
                            style={[styles.navButton, styles.nextButton]}
                        >
                            <ArrowForwardIcon />
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        alignItems: 'flex-end',
    },
    skipButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    skipText: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    illustrationContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 32,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 40,
    },
    subtitle: {
        fontFamily: 'Inter-Regular',
        fontSize: 18,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    bottom: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.borderColor,
        marginHorizontal: 4,
    },
    progressDotActive: {
        backgroundColor: Colors.secondaryColor,
        width: 24,
    },
    navigationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    navButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    prevButton: {
        backgroundColor: Colors.backgroundWhite,
        borderWidth: 2,
        borderColor: Colors.borderColor,
    },
    nextButton: {
        backgroundColor: Colors.secondaryColor,
        minWidth: 56,
        paddingHorizontal: 24,
    },
    navButtonDisabled: {
        opacity: 0.3,
    },
    nextButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
    getStartedButton: {
        backgroundColor: Colors.secondaryColor,
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    getStartedButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.backgroundWhite,
    },
}); 