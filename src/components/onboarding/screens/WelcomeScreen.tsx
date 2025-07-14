import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { Colors } from '../../../../constants/Colors';
import OnboardingScreen, { OnboardingScreenProps } from '../OnboardingScreen';

// Enhanced SVG illustration for welcome screen
function WelcomeIllustration() {
    return (
        <View style={styles.illustrationContainer}>
            <Svg width="280" height="280" viewBox="0 0 280 280">
                <Defs>
                    {/* Gradient definitions */}
                    <LinearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={Colors.secondaryColor} stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#F87171" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Main illustration centered */}
                <G transform="translate(140, 140)">
                    {/* Enhanced leaf with gradient and details */}
                    <G transform="rotate(-15)">
                        <Path
                            d="M0,-5 Q-30,-80 -10,-100 Q10,-105 30,-95 Q40,-75 35,-50 Q25,-25 0,-5 Z"
                            fill="url(#primaryGradient)"
                            stroke="#047857"
                            strokeWidth="2"
                        />

                        {/* Leaf veins for detail */}
                        <Path d="M0,-5 Q-15,-30 -25,-50" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.7" />
                        <Path d="M0,-5 Q0,-35 5,-60" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.7" />
                        <Path d="M0,-5 Q15,-30 25,-50" stroke="#047857" strokeWidth="1.5" fill="none" opacity="0.7" />

                        {/* Small highlight for glossy effect */}
                        <Path
                            d="M-20,-60 Q-10,-70 0,-65 Q-5,-55 -20,-60 Z"
                            fill="#FFFFFF"
                            opacity="0.3"
                        />
                    </G>

                    {/* Enhanced sparkles with gradient */}
                    <G>
                        <Circle cx="-65" cy="-35" r="6" fill="url(#sparkleGradient)" opacity="0.8" />
                        <Path d="M-65,-41 L-65,-29 M-71,-35 L-59,-35" stroke="url(#sparkleGradient)" strokeWidth="2" strokeLinecap="round" />

                        <Circle cx="65" cy="-25" r="5" fill="url(#sparkleGradient)" opacity="0.9" />
                        <Path d="M65,-30 L65,-20 M60,-25 L70,-25" stroke="url(#sparkleGradient)" strokeWidth="2" strokeLinecap="round" />

                        <Circle cx="50" cy="50" r="7" fill="url(#sparkleGradient)" opacity="0.7" />
                        <Path d="M50,43 L50,57 M43,50 L57,50" stroke="url(#sparkleGradient)" strokeWidth="2" strokeLinecap="round" />

                        <Circle cx="-50" cy="45" r="4" fill="url(#sparkleGradient)" opacity="0.8" />
                        <Path d="M-50,41 L-50,49 M-54,45 L-46,45" stroke="url(#sparkleGradient)" strokeWidth="2" strokeLinecap="round" />
                    </G>

                    {/* Enhanced heart with gradient */}
                    <G>
                        <Path
                            d="M-5,25 C-12,18 -25,18 -25,30 C-25,42 -5,55 0,60 C5,55 25,42 25,30 C25,18 12,18 5,25 Z"
                            fill="url(#heartGradient)"
                            opacity="0.9"
                        />

                        {/* Heart highlight */}
                        <Path
                            d="M-5,25 C-8,22 -15,22 -15,28 C-15,34 -5,42 0,45 C2,43 8,38 8,32 C8,28 5,26 2,28"
                            fill="#FFFFFF"
                            opacity="0.4"
                        />
                    </G>

                    {/* Enhanced floating elements */}
                    <G>
                        {/* Floating food icons around the main element */}
                        <Circle cx="-80" cy="0" r="8" fill="#F87171" opacity="0.8" />
                        <Path d="M-85,-3 Q-80,-8 -75,-3 Q-80,2 -85,-3 Z" fill="#FFFFFF" opacity="0.6" />

                        <Circle cx="80" cy="20" r="6" fill="#FBBF24" opacity="0.7" />
                        <Path d="M77,17 Q80,14 83,17 Q80,20 77,17 Z" fill="#FFFFFF" opacity="0.5" />

                        <Circle cx="-40" cy="-70" r="5" fill={Colors.secondaryColor} opacity="0.6" />
                        <Path d="M-42,-72 Q-40,-75 -38,-72 Q-40,-69 -42,-72 Z" fill="#FFFFFF" opacity="0.4" />

                        <Circle cx="70" cy="-50" r="7" fill="#A855F7" opacity="0.5" />
                        <Path d="M67,-53 Q70,-56 73,-53 Q70,-50 67,-53 Z" fill="#FFFFFF" opacity="0.3" />
                    </G>
                </G>

                {/* Floating particles around the entire illustration */}
                <G opacity="0.6">
                    <Circle cx="50" cy="80" r="2" fill={Colors.secondaryColor} />
                    <Circle cx="230" cy="100" r="1.5" fill="#FBBF24" />
                    <Circle cx="60" cy="220" r="2.5" fill="#F87171" />
                    <Circle cx="220" cy="200" r="2" fill={Colors.secondaryColor} />
                </G>
            </Svg>
        </View>
    );
}

export default function WelcomeScreen(props: OnboardingScreenProps) {
    const { t } = useTranslation();

    return (
        <OnboardingScreen
            {...props}
            illustration={<WelcomeIllustration />}
            title={t('onboarding_welcome_title')}
            subtitle={t('onboarding_welcome_subtitle')}
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