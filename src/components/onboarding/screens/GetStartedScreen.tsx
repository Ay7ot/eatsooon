import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Colors } from '../../../../constants/Colors';
import OnboardingScreen, { OnboardingScreenProps } from '../OnboardingScreen';

// Enhanced SVG illustration for get started screen
function GetStartedIllustration() {
    return (
        <View style={styles.illustrationContainer}>
            <Svg width="280" height="280" viewBox="0 0 280 280">
                <Defs>
                    {/* Gradient definitions */}
                    <LinearGradient id="celebrationGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={Colors.secondaryColor} stopOpacity="1" />
                        <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F0FDF4" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="confettiGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#F87171" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="confettiGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="confettiGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="rocketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#E5E7EB" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#9CA3AF" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Main illustration centered */}
                <G transform="translate(140, 140)">
                    {/* Central success checkmark */}
                    <G>
                        {/* Success circle background */}
                        <Circle cx="0" cy="0" r="50" fill="url(#successGradient)" stroke={Colors.secondaryColor} strokeWidth="3" />
                        <Circle cx="0" cy="0" r="45" fill="url(#celebrationGradient)" opacity="0.1" />

                        {/* Large checkmark */}
                        <Path
                            d="M-20,0 L-8,12 L20,-16"
                            stroke={Colors.secondaryColor}
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Inner glow effect */}
                        <Circle cx="0" cy="0" r="35" fill="none" stroke="#FFFFFF" strokeWidth="2" opacity="0.5" />
                    </G>

                    {/* Rocket launching */}
                    <G transform="translate(60, -60)">
                        {/* Rocket body */}
                        <Path d="M0,-20 Q-8,-25 -8,-15 L-8,15 Q-8,20 0,20 Q8,20 8,15 L8,-15 Q8,-25 0,-20 Z" fill="url(#rocketGradient)" />

                        {/* Rocket nose */}
                        <Path d="M0,-20 Q-6,-30 0,-35 Q6,-30 0,-20 Z" fill="#F59E0B" />

                        {/* Rocket fins */}
                        <Path d="M-8,10 L-15,20 L-8,20 Z" fill="#6B7280" />
                        <Path d="M8,10 L15,20 L8,20 Z" fill="#6B7280" />

                        {/* Rocket window */}
                        <Circle cx="0" cy="-5" r="4" fill="#3B82F6" />
                        <Circle cx="0" cy="-5" r="3" fill="#DBEAFE" />

                        {/* Rocket flames */}
                        <G transform="translate(0, 20)">
                            <Path d="M-6,0 Q-3,8 0,12 Q3,8 6,0" fill="#EF4444" />
                            <Path d="M-4,0 Q-2,6 0,8 Q2,6 4,0" fill="#FBBF24" />
                            <Path d="M-2,0 Q-1,4 0,5 Q1,4 2,0" fill="#FFFFFF" />
                        </G>
                    </G>

                    {/* Trophy */}
                    <G transform="translate(-70, -40)">
                        {/* Trophy base */}
                        <Rect x="-8" y="15" width="16" height="8" fill="#D97706" rx="2" />
                        <Rect x="-6" y="10" width="12" height="5" fill="#F59E0B" />

                        {/* Trophy cup */}
                        <Path d="M-10,-10 Q-12,-20 -8,-25 Q0,-30 8,-25 Q12,-20 10,-10 L10,10 L-10,10 Z" fill="#FBBF24" />

                        {/* Trophy handles */}
                        <Path d="M-10,-5 Q-15,-5 -15,0 Q-15,5 -10,5" stroke="#F59E0B" strokeWidth="2" fill="none" />
                        <Path d="M10,-5 Q15,-5 15,0 Q15,5 10,5" stroke="#F59E0B" strokeWidth="2" fill="none" />

                        {/* Trophy shine */}
                        <Path d="M-6,-20 Q-3,-25 0,-20 Q-3,-15 -6,-20 Z" fill="#FFFFFF" opacity="0.6" />

                        {/* Trophy star */}
                        <Path d="M0,-15 L2,-10 L7,-10 L3,-6 L5,-1 L0,-4 L-5,-1 L-3,-6 L-7,-10 L-2,-10 Z" fill="#EF4444" />
                    </G>

                    {/* Celebration confetti */}
                    <G opacity="0.8">
                        {/* Confetti pieces - various shapes and colors */}
                        <G transform="translate(-80, -80)">
                            <Rect x="0" y="0" width="6" height="6" fill="url(#confettiGradient1)" rx="1" transform="rotate(45)" />
                        </G>
                        <G transform="translate(80, -70)">
                            <Circle cx="0" cy="0" r="3" fill="url(#confettiGradient2)" />
                        </G>
                        <G transform="translate(-90, 20)">
                            <Path d="M0,-4 L2,0 L0,4 L-2,0 Z" fill="url(#confettiGradient3)" />
                        </G>
                        <G transform="translate(90, 30)">
                            <Rect x="0" y="0" width="8" height="3" fill="url(#confettiGradient1)" rx="1" transform="rotate(30)" />
                        </G>
                        <G transform="translate(-60, 80)">
                            <Circle cx="0" cy="0" r="2" fill="url(#confettiGradient2)" />
                        </G>
                        <G transform="translate(70, 70)">
                            <Path d="M0,-3 L3,0 L0,3 L-3,0 Z" fill="url(#confettiGradient3)" />
                        </G>
                        <G transform="translate(-40, -100)">
                            <Rect x="0" y="0" width="4" height="4" fill="url(#confettiGradient1)" rx="1" transform="rotate(15)" />
                        </G>
                        <G transform="translate(50, -90)">
                            <Circle cx="0" cy="0" r="2.5" fill="url(#confettiGradient2)" />
                        </G>
                    </G>

                    {/* Achievement badges */}
                    <G opacity="0.7">
                        {/* Badge 1 - Inventory */}
                        <G transform="translate(-90, 60)">
                            <Circle cx="0" cy="0" r="12" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" />
                            <Path d="M-6,-3 L-6,6 L6,6 L6,-3 L0,-6 Z" fill="#3B82F6" />
                            <Rect x="-3" y="-1" width="6" height="2" fill="#FFFFFF" />
                            <Rect x="-3" y="2" width="6" height="2" fill="#FFFFFF" />
                        </G>

                        {/* Badge 2 - Family */}
                        <G transform="translate(90, -20)">
                            <Circle cx="0" cy="0" r="12" fill="#FEE2E2" stroke="#EF4444" strokeWidth="2" />
                            <Circle cx="-3" cy="-2" r="3" fill="#EF4444" />
                            <Circle cx="3" cy="-2" r="3" fill="#EF4444" />
                            <Path d="M-6,4 Q-3,2 0,4 Q3,2 6,4" stroke="#EF4444" strokeWidth="2" fill="none" />
                        </G>

                        {/* Badge 3 - Recipes */}
                        <G transform="translate(0, 90)">
                            <Circle cx="0" cy="0" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
                            <Path d="M-4,-4 Q0,-6 4,-4 Q4,0 0,6 Q-4,0 -4,-4 Z" fill="#F59E0B" />
                            <Circle cx="0" cy="-2" r="1" fill="#FFFFFF" />
                        </G>
                    </G>

                    {/* Sparkles around success circle */}
                    <G opacity="0.6">
                        <G transform="translate(-70, -20)">
                            <Path d="M0,-6 L1,-1 L6,0 L1,1 L0,6 L-1,1 L-6,0 L-1,-1 Z" fill="#FBBF24" />
                        </G>
                        <G transform="translate(70, 20)">
                            <Path d="M0,-6 L1,-1 L6,0 L1,1 L0,6 L-1,1 L-6,0 L-1,-1 Z" fill="#A855F7" />
                        </G>
                        <G transform="translate(-20, -70)">
                            <Path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill="#EF4444" />
                        </G>
                        <G transform="translate(30, 70)">
                            <Path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill={Colors.secondaryColor} />
                        </G>
                    </G>

                    {/* Success rays */}
                    <G stroke={Colors.secondaryColor} strokeWidth="2" opacity="0.3">
                        <Path d="M0,-80 L0,-60" />
                        <Path d="M56,-56 L42,-42" />
                        <Path d="M80,0 L60,0" />
                        <Path d="M56,56 L42,42" />
                        <Path d="M0,80 L0,60" />
                        <Path d="M-56,56 L-42,42" />
                        <Path d="M-80,0 L-60,0" />
                        <Path d="M-56,-56 L-42,-42" />
                    </G>
                </G>

                {/* Floating particles */}
                <G opacity="0.5">
                    <Circle cx="60" cy="50" r="1.5" fill="#10B981" />
                    <Circle cx="220" cy="70" r="1" fill="#FBBF24" />
                    <Circle cx="50" cy="230" r="2" fill="#F87171" />
                    <Circle cx="230" cy="210" r="1.5" fill="#A855F7" />
                </G>
            </Svg>
        </View>
    );
}

export default function GetStartedScreen(props: OnboardingScreenProps) {
    const { t } = useTranslation();

    return (
        <OnboardingScreen
            {...props}
            illustration={<GetStartedIllustration />}
            title={t('onboarding_get_started_title')}
            subtitle={t('onboarding_get_started_subtitle')}
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