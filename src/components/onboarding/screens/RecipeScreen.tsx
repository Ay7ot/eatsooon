import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';
import { Colors } from '../../../../constants/Colors';
import OnboardingScreen, { OnboardingScreenProps } from '../OnboardingScreen';

// Enhanced SVG illustration for recipe screen
function RecipeIllustration() {
    return (
        <View style={styles.illustrationContainer}>
            <Svg width="280" height="280" viewBox="0 0 280 280">
                <Defs>
                    {/* Gradient definitions */}
                    <LinearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FEF3C7" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="plateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F3F4F6" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="foodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#F87171" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="steamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#E5E7EB" stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#F3F4F6" stopOpacity="0.3" />
                    </LinearGradient>
                    <LinearGradient id="panGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#6B7280" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#374151" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Main illustration centered */}
                <G transform="translate(140, 140)">
                    {/* Recipe book */}
                    <G transform="translate(-40, -20)">
                        {/* Book cover */}
                        <Rect x="-25" y="-35" width="50" height="70" fill="url(#bookGradient)" rx="3" />
                        <Rect x="-23" y="-33" width="46" height="66" fill="none" stroke="#D97706" strokeWidth="1" rx="2" />

                        {/* Book spine */}
                        <Rect x="-25" y="-35" width="8" height="70" fill="#D97706" rx="3" />

                        {/* Book title area */}
                        <Rect x="-15" y="-25" width="30" height="15" fill="#FFFFFF" opacity="0.9" rx="2" />
                        <Rect x="-12" y="-22" width="24" height="2" fill="#D97706" />
                        <Rect x="-12" y="-18" width="18" height="2" fill="#D97706" />
                        <Rect x="-12" y="-14" width="20" height="2" fill="#D97706" />

                        {/* Recipe illustration on cover */}
                        <Circle cx="0" cy="10" r="8" fill="#FFFFFF" opacity="0.9" />
                        <Circle cx="0" cy="10" r="6" fill="url(#foodGradient)" />
                        <Path d="M-3,7 Q0,5 3,7" fill="#FFFFFF" opacity="0.4" />

                        {/* Page corner */}
                        <Path d="M20,-30 L20,-25 L15,-25 Z" fill="#FFFFFF" opacity="0.6" />

                        {/* Bookmark */}
                        <Rect x="20" y="-35" width="4" height="20" fill="#EF4444" />
                        <Path d="M22,-15 L20,-12 L24,-12 Z" fill="#EF4444" />
                    </G>

                    {/* Cooking pan with food */}
                    <G transform="translate(40, 10)">
                        {/* Pan */}
                        <Ellipse cx="0" cy="15" rx="25" ry="8" fill="url(#panGradient)" />
                        <Ellipse cx="0" cy="12" rx="25" ry="8" fill="#4B5563" />
                        <Ellipse cx="0" cy="10" rx="23" ry="7" fill="#374151" />

                        {/* Pan handle */}
                        <Rect x="23" y="8" width="15" height="4" fill="url(#panGradient)" rx="2" />
                        <Circle cx="38" cy="10" r="3" fill="#6B7280" />

                        {/* Food in pan */}
                        <Ellipse cx="-8" cy="8" rx="6" ry="4" fill="url(#foodGradient)" />
                        <Ellipse cx="8" cy="6" rx="5" ry="3" fill="#FBBF24" />
                        <Ellipse cx="0" cy="10" rx="4" ry="3" fill={Colors.secondaryColor} />
                        <Ellipse cx="-5" cy="12" rx="3" ry="2" fill="#A855F7" />

                        {/* Steam rising */}
                        <G opacity="0.7">
                            <Path d="M-15,-5 Q-12,-15 -10,-5 Q-8,-15 -5,-5" stroke="url(#steamGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
                            <Path d="M0,-8 Q3,-18 5,-8 Q8,-18 10,-8" stroke="url(#steamGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
                            <Path d="M15,-5 Q18,-15 20,-5 Q22,-15 25,-5" stroke="url(#steamGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </G>
                    </G>

                    {/* Cooking utensils */}
                    <G transform="translate(-70, 20)">
                        {/* Wooden spoon */}
                        <Rect x="-2" y="-25" width="4" height="35" fill="#D97706" rx="2" />
                        <Ellipse cx="0" cy="-25" rx="4" ry="6" fill="#F59E0B" />
                        <Path d="M-3,-28 Q0,-30 3,-28" fill="#FFFFFF" opacity="0.3" />

                        {/* Fork */}
                        <G transform="translate(15, 0)">
                            <Rect x="-1" y="-20" width="2" height="30" fill="#9CA3AF" />
                            <Rect x="-3" y="-25" width="1" height="8" fill="#9CA3AF" />
                            <Rect x="-1" y="-25" width="1" height="8" fill="#9CA3AF" />
                            <Rect x="1" y="-25" width="1" height="8" fill="#9CA3AF" />
                            <Rect x="3" y="-25" width="1" height="8" fill="#9CA3AF" />
                        </G>
                    </G>

                    {/* Ingredients around */}
                    <G opacity="0.8">
                        {/* Tomato */}
                        <G transform="translate(-80, -40)">
                            <Circle cx="0" cy="0" r="8" fill="#EF4444" />
                            <Path d="M-3,-6 Q0,-10 3,-6" stroke="#059669" strokeWidth="2" fill="none" />
                            <Path d="M0,-10 Q-2,-12 0,-14 Q2,-12 0,-10" fill="#059669" />
                            <Path d="M-4,-2 Q0,-6 4,-2" fill="#FFFFFF" opacity="0.3" />
                        </G>

                        {/* Onion */}
                        <G transform="translate(80, -30)">
                            <Ellipse cx="0" cy="0" rx="6" ry="8" fill="#F3F4F6" />
                            <Path d="M-4,-5 Q0,-8 4,-5" stroke="#E5E7EB" strokeWidth="1" fill="none" />
                            <Path d="M-3,0 Q0,-2 3,0" stroke="#E5E7EB" strokeWidth="1" fill="none" />
                            <Path d="M-2,5 Q0,3 2,5" stroke="#E5E7EB" strokeWidth="1" fill="none" />
                            <Path d="M0,-8 Q-1,-10 0,-12 Q1,-10 0,-8" fill="#059669" />
                        </G>

                        {/* Carrot */}
                        <G transform="translate(-60, 60)">
                            <Path d="M0,0 Q-2,-15 0,-20 Q2,-15 0,0" fill="#F97316" />
                            <Path d="M-1,-3 Q0,-5 1,-3" stroke="#FFFFFF" strokeWidth="1" fill="none" />
                            <Path d="M-1,3 Q0,1 1,3" stroke="#FFFFFF" strokeWidth="1" fill="none" />
                            <G transform="translate(0, -20)">
                                <Path d="M-2,0 Q-1,-5 0,0" stroke="#059669" strokeWidth="1" fill="none" />
                                <Path d="M0,0 Q1,-4 2,0" stroke="#059669" strokeWidth="1" fill="none" />
                                <Path d="M2,0 Q3,-3 4,0" stroke="#059669" strokeWidth="1" fill="none" />
                            </G>
                        </G>

                        {/* Bell pepper */}
                        <G transform="translate(70, 50)">
                            <Path d="M-6,0 Q-8,-10 -4,-15 Q0,-18 4,-15 Q8,-10 6,0 Q4,8 0,10 Q-4,8 -6,0 Z" fill="#FBBF24" />
                            <Path d="M0,-18 Q-1,-20 0,-22 Q1,-20 0,-18" fill="#059669" />
                            <Path d="M-3,-8 Q0,-12 3,-8" fill="#FFFFFF" opacity="0.3" />
                        </G>
                    </G>

                    {/* Recipe steps indicators */}
                    <G transform="translate(0, -60)" opacity="0.6">
                        {/* Step bubbles */}
                        <Circle cx="-30" cy="0" r="8" fill="#3B82F6" />
                        <Text x="-30" y="2" textAnchor="middle" fontSize="8" fill="#FFFFFF">1</Text>

                        <Circle cx="0" cy="0" r="8" fill="#10B981" />
                        <Text x="0" y="2" textAnchor="middle" fontSize="8" fill="#FFFFFF">2</Text>

                        <Circle cx="30" cy="0" r="8" fill="#F59E0B" />
                        <Text x="30" y="2" textAnchor="middle" fontSize="8" fill="#FFFFFF">3</Text>

                        {/* Connecting lines */}
                        <Path d="M-22,0 L-8,0" stroke="#E5E7EB" strokeWidth="2" />
                        <Path d="M8,0 L22,0" stroke="#E5E7EB" strokeWidth="2" />
                    </G>

                    {/* Floating cooking icons */}
                    <G opacity="0.5">
                        {/* Timer */}
                        <G transform="translate(-90, 0)">
                            <Circle cx="0" cy="0" r="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
                            <Circle cx="0" cy="0" r="8" fill="#F3F4F6" />
                            <Path d="M0,-6 L0,0 L4,4" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
                            <Circle cx="0" cy="0" r="1" fill="#374151" />
                        </G>

                        {/* Chef hat */}
                        <G transform="translate(90, -10)">
                            <Ellipse cx="0" cy="5" rx="12" ry="4" fill="#FFFFFF" />
                            <Path d="M-10,5 Q-12,-5 -8,-10 Q-4,-12 0,-10 Q4,-12 8,-10 Q12,-5 10,5" fill="#FFFFFF" />
                            <Path d="M-8,-8 Q-4,-10 0,-8 Q4,-10 8,-8" fill="#F3F4F6" />
                        </G>

                        {/* Recipe rating stars */}
                        <G transform="translate(0, 80)">
                            <Path d="M-15,0 L-12,3 L-9,0 L-12,-3 Z" fill="#FBBF24" />
                            <Path d="M-5,0 L-2,3 L1,0 L-2,-3 Z" fill="#FBBF24" />
                            <Path d="M5,0 L8,3 L11,0 L8,-3 Z" fill="#FBBF24" />
                        </G>
                    </G>
                </G>

                {/* Floating particles */}
                <G opacity="0.4">
                    <Circle cx="50" cy="70" r="1.5" fill="#F59E0B" />
                    <Circle cx="230" cy="90" r="1" fill="#EF4444" />
                    <Circle cx="60" cy="220" r="2" fill="#10B981" />
                    <Circle cx="220" cy="200" r="1.5" fill="#3B82F6" />
                </G>
            </Svg>
        </View>
    );
}

export default function RecipeScreen(props: OnboardingScreenProps) {
    const { t } = useTranslation();

    return (
        <OnboardingScreen
            {...props}
            illustration={<RecipeIllustration />}
            title={t('onboarding_recipe_title')}
            subtitle={t('onboarding_recipe_subtitle')}
        />
    );
}

const styles = StyleSheet.create({
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
}); 