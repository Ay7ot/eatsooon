import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Colors } from '../../../../constants/Colors';
import OnboardingScreen, { OnboardingScreenProps } from '../OnboardingScreen';

// Enhanced SVG illustration for family screen
function FamilyIllustration() {
    return (
        <View style={styles.illustrationContainer}>
            <Svg width="280" height="280" viewBox="0 0 280 280">
                <Defs>
                    {/* Gradient definitions */}
                    <LinearGradient id="familyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={Colors.secondaryColor} stopOpacity="0.8" />
                        <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#F87171" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.8" />
                    </LinearGradient>
                    <LinearGradient id="person1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="person2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#A855F7" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#7C3AED" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="person3Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#EC4899" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#DB2777" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Main illustration centered */}
                <G transform="translate(140, 140)">
                    {/* Central family hub/house */}
                    <G>
                        {/* House shape */}
                        <Path
                            d="M-35,10 L-35,40 L35,40 L35,10 L0,-20 Z"
                            fill="url(#familyGradient)"
                            stroke="#047857"
                            strokeWidth="2"
                        />

                        {/* Roof highlight */}
                        <Path d="M-30,10 L0,-15 L30,10 L25,5 L0,-10 L-25,5 Z" fill="#FFFFFF" opacity="0.3" />

                        {/* Door */}
                        <Rect x="-8" y="15" width="16" height="25" fill="#FFFFFF" rx="8" />
                        <Circle cx="5" cy="27" r="1.5" fill="#6B7280" />

                        {/* Windows */}
                        <Rect x="-25" y="20" width="8" height="8" fill="#FFFFFF" rx="2" />
                        <Path d="M-21,20 L-21,28 M-25,24 L-17,24" stroke="#E5E7EB" strokeWidth="1" />

                        <Rect x="17" y="20" width="8" height="8" fill="#FFFFFF" rx="2" />
                        <Path d="M21,20 L21,28 M17,24 L25,24" stroke="#E5E7EB" strokeWidth="1" />

                        {/* Heart above house */}
                        <Path
                            d="M-5,-35 C-8,-38 -15,-38 -15,-30 C-15,-22 -5,-15 0,-10 C5,-15 15,-22 15,-30 C15,-38 8,-38 5,-35 Z"
                            fill="url(#heartGradient)"
                            opacity="0.9"
                        />
                    </G>

                    {/* Family members around the house */}
                    <G>
                        {/* Family member 1 - Left */}
                        <G transform="translate(-70, -10)">
                            <Circle cx="0" cy="0" r="20" fill="url(#person1Gradient)" opacity="0.2" />
                            <Circle cx="0" cy="-5" r="8" fill="url(#person1Gradient)" />
                            <Path d="M-6,-5 Q-3,-8 0,-5 Q3,-8 6,-5" fill="#FFFFFF" opacity="0.4" />
                            <Circle cx="-2" cy="-7" r="1" fill="#374151" />
                            <Circle cx="2" cy="-7" r="1" fill="#374151" />
                            <Path d="M-2,-3 Q0,-1 2,-3" stroke="#374151" strokeWidth="1" fill="none" />

                            {/* Body */}
                            <Rect x="-4" y="3" width="8" height="12" fill="url(#person1Gradient)" rx="4" />
                            <Path d="M-3,5 Q0,3 3,5" fill="#FFFFFF" opacity="0.3" />
                        </G>

                        {/* Family member 2 - Right */}
                        <G transform="translate(70, -10)">
                            <Circle cx="0" cy="0" r="20" fill="url(#person2Gradient)" opacity="0.2" />
                            <Circle cx="0" cy="-5" r="8" fill="url(#person2Gradient)" />
                            <Path d="M-6,-5 Q-3,-8 0,-5 Q3,-8 6,-5" fill="#FFFFFF" opacity="0.4" />
                            <Circle cx="-2" cy="-7" r="1" fill="#374151" />
                            <Circle cx="2" cy="-7" r="1" fill="#374151" />
                            <Path d="M-2,-3 Q0,-1 2,-3" stroke="#374151" strokeWidth="1" fill="none" />

                            {/* Body */}
                            <Rect x="-4" y="3" width="8" height="12" fill="url(#person2Gradient)" rx="4" />
                            <Path d="M-3,5 Q0,3 3,5" fill="#FFFFFF" opacity="0.3" />
                        </G>

                        {/* Family member 3 - Bottom */}
                        <G transform="translate(0, 70)">
                            <Circle cx="0" cy="0" r="20" fill="url(#person3Gradient)" opacity="0.2" />
                            <Circle cx="0" cy="-5" r="8" fill="url(#person3Gradient)" />
                            <Path d="M-6,-5 Q-3,-8 0,-5 Q3,-8 6,-5" fill="#FFFFFF" opacity="0.4" />
                            <Circle cx="-2" cy="-7" r="1" fill="#374151" />
                            <Circle cx="2" cy="-7" r="1" fill="#374151" />
                            <Path d="M-2,-3 Q0,-1 2,-3" stroke="#374151" strokeWidth="1" fill="none" />

                            {/* Body */}
                            <Rect x="-4" y="3" width="8" height="12" fill="url(#person3Gradient)" rx="4" />
                            <Path d="M-3,5 Q0,3 3,5" fill="#FFFFFF" opacity="0.3" />
                        </G>
                    </G>

                    {/* Connection lines between family members */}
                    <G stroke="url(#connectionGradient)" strokeWidth="3" fill="none" opacity="0.6">
                        <Path d="M-50,-10 Q-25,5 0,0" strokeDasharray="5,5" />
                        <Path d="M50,-10 Q25,5 0,0" strokeDasharray="5,5" />
                        <Path d="M0,50 Q0,25 0,0" strokeDasharray="5,5" />
                    </G>

                    {/* Floating sharing icons */}
                    <G opacity="0.7">
                        {/* Share icon - top left */}
                        <Circle cx="-80" cy="-60" r="12" fill="#3B82F6" opacity="0.2" />
                        <Circle cx="-85" cy="-65" r="3" fill="#3B82F6" />
                        <Circle cx="-75" cy="-55" r="3" fill="#3B82F6" />
                        <Circle cx="-80" cy="-60" r="2" fill="#3B82F6" />
                        <Path d="M-85,-65 L-80,-60 M-80,-60 L-75,-55" stroke="#3B82F6" strokeWidth="2" />

                        {/* Notification icon - top right */}
                        <Circle cx="80" cy="-60" r="12" fill="#FBBF24" opacity="0.2" />
                        <Path d="M75,-65 Q80,-70 85,-65 Q85,-55 80,-50 Q75,-55 75,-65 Z" fill="#FBBF24" />
                        <Path d="M78,-48 Q80,-46 82,-48" stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <Circle cx="83" cy="-68" r="2" fill="#EF4444" />

                        {/* Sync icon - bottom left */}
                        <Circle cx="-80" cy="80" r="12" fill={Colors.secondaryColor} opacity="0.2" />
                        <Path d="M-85,75 Q-80,70 -75,75 M-75,85 Q-80,90 -85,85" stroke={Colors.secondaryColor} strokeWidth="3" fill="none" strokeLinecap="round" />
                        <Path d="M-78,72 L-75,75 L-78,78" stroke={Colors.secondaryColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <Path d="M-82,82 L-85,85 L-82,88" stroke={Colors.secondaryColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Love/heart icon - bottom right */}
                        <Circle cx="80" cy="80" r="12" fill="#EC4899" opacity="0.2" />
                        <Path d="M75,77 C72,74 68,74 68,80 C68,86 75,92 80,95 C85,92 92,86 92,80 C92,74 88,74 85,77 Z" fill="#EC4899" opacity="0.8" />
                    </G>

                    {/* Small decorative elements */}
                    <G opacity="0.6">
                        {/* Stars around the family */}
                        <G transform="translate(-100, 0)">
                            <Path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill="#FBBF24" />
                        </G>
                        <G transform="translate(100, 0)">
                            <Path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill="#A855F7" />
                        </G>
                        <G transform="translate(0, -80)">
                            <Path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill={Colors.secondaryColor} />
                        </G>
                        <G transform="translate(0, 100)">
                            <Path d="M0,-4 L1,-1 L4,0 L1,1 L0,4 L-1,1 L-4,0 L-1,-1 Z" fill="#EC4899" />
                        </G>
                    </G>
                </G>

                {/* Floating particles */}
                <G opacity="0.4">
                    <Circle cx="50" cy="60" r="1.5" fill="#3B82F6" />
                    <Circle cx="230" cy="80" r="1" fill="#FBBF24" />
                    <Circle cx="60" cy="220" r="2" fill="#EC4899" />
                    <Circle cx="220" cy="200" r="1.5" fill={Colors.secondaryColor} />
                </G>
            </Svg>
        </View>
    );
}

export default function FamilyScreen(props: OnboardingScreenProps) {
    const { t } = useTranslation();

    return (
        <OnboardingScreen
            {...props}
            illustration={<FamilyIllustration />}
            title={t('onboarding_family_title')}
            subtitle={t('onboarding_family_subtitle')}
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