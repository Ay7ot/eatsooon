import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text } from 'react-native-svg';
import { Colors } from '../../../../constants/Colors';
import OnboardingScreen, { OnboardingScreenProps } from '../OnboardingScreen';

// Enhanced SVG illustration for inventory screen
function InventoryIllustration() {
    return (
        <View style={styles.illustrationContainer}>
            <Svg width="280" height="280" viewBox="0 0 280 280">
                <Defs>
                    {/* Gradient definitions */}
                    <LinearGradient id="pantryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#F3F4F6" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#E5E7EB" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="shelfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#D1D5DB" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#9CA3AF" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="appleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#F87171" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="bananaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="leafyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={Colors.secondaryColor} stopOpacity="1" />
                        <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
                    </LinearGradient>
                    <LinearGradient id="milkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F3F4F6" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Main illustration centered */}
                <G transform="translate(140, 140)">
                    {/* Pantry/Cabinet structure */}
                    <G>
                        {/* Main cabinet body */}
                        <Rect
                            x="-80"
                            y="-90"
                            width="160"
                            height="140"
                            fill="url(#pantryGradient)"
                            stroke="#9CA3AF"
                            strokeWidth="2"
                            rx="8"
                        />

                        {/* Cabinet door frame */}
                        <Rect
                            x="-75"
                            y="-85"
                            width="150"
                            height="130"
                            fill="none"
                            stroke="#6B7280"
                            strokeWidth="1"
                            rx="4"
                        />

                        {/* Door handle */}
                        <Circle cx="65" cy="-20" r="4" fill="#374151" />
                        <Circle cx="65" cy="-20" r="2" fill="#9CA3AF" />

                        {/* Shelves */}
                        <Rect x="-70" y="-60" width="140" height="4" fill="url(#shelfGradient)" rx="2" />
                        <Rect x="-70" y="-20" width="140" height="4" fill="url(#shelfGradient)" rx="2" />
                        <Rect x="-70" y="20" width="140" height="4" fill="url(#shelfGradient)" rx="2" />
                    </G>

                    {/* Food items on shelves */}
                    <G>
                        {/* Top shelf - Fruits */}
                        <G transform="translate(-40, -75)">
                            {/* Apple */}
                            <Circle cx="0" cy="0" r="12" fill="url(#appleGradient)" />
                            <Path d="M-3,-8 Q0,-12 3,-8" stroke="#059669" strokeWidth="2" fill="none" />
                            <Path d="M0,-12 Q-2,-15 0,-18 Q2,-15 0,-12" fill="#059669" />
                            <Path d="M-6,-2 Q-2,-6 2,-2" fill="#FFFFFF" opacity="0.3" />
                        </G>

                        <G transform="translate(0, -75)">
                            {/* Banana */}
                            <Path d="M-8,5 Q-12,-5 -8,-15 Q-4,-18 0,-15 Q4,-12 8,-5 Q12,5 8,15 Q4,18 0,15 Q-4,12 -8,5 Z" fill="url(#bananaGradient)" />
                            <Path d="M-6,0 Q-2,-8 2,-5 Q6,0 2,8 Q-2,5 -6,0 Z" fill="#FFFFFF" opacity="0.2" />
                        </G>

                        <G transform="translate(40, -75)">
                            {/* Leafy greens */}
                            <Path d="M-10,-5 Q-15,-15 -5,-18 Q5,-20 15,-15 Q20,-5 15,5 Q5,8 -5,5 Q-15,-5 -10,-5 Z" fill="url(#leafyGradient)" />
                            <Path d="M-8,-10 Q-5,-15 -2,-10 Q0,-5 -2,0 Q-5,5 -8,0 Q-10,-5 -8,-10 Z" fill="#FFFFFF" opacity="0.3" />
                            <Path d="M5,-12 Q8,-16 11,-12 Q13,-8 11,-4 Q8,0 5,-4 Q3,-8 5,-12 Z" fill="#FFFFFF" opacity="0.3" />
                        </G>

                        {/* Middle shelf - Packaged goods */}
                        <G transform="translate(-40, -35)">
                            {/* Cereal box */}
                            <Rect x="-8" y="-12" width="16" height="24" fill="#F59E0B" rx="2" />
                            <Rect x="-6" y="-10" width="12" height="6" fill="#FFFFFF" opacity="0.8" />
                            <Circle cx="0" cy="-7" r="2" fill="#EF4444" />
                            <Rect x="-6" y="-2" width="12" height="2" fill="#FFFFFF" opacity="0.6" />
                            <Rect x="-6" y="2" width="12" height="2" fill="#FFFFFF" opacity="0.6" />
                        </G>

                        <G transform="translate(0, -35)">
                            {/* Milk carton */}
                            <Path d="M-6,-15 L-6,-10 L-8,-8 L-8,12 L8,12 L8,-8 L6,-10 L6,-15 Z" fill="url(#milkGradient)" stroke="#E5E7EB" strokeWidth="1" />
                            <Path d="M-6,-15 L0,-18 L6,-15" fill="url(#milkGradient)" stroke="#E5E7EB" strokeWidth="1" />
                            <Rect x="-5" y="-8" width="10" height="4" fill="#3B82F6" />
                            <Text x="0" y="-6" textAnchor="middle" fontSize="6" fill="#FFFFFF">MILK</Text>
                        </G>

                        <G transform="translate(40, -35)">
                            {/* Pasta box */}
                            <Rect x="-6" y="-12" width="12" height="24" fill="#FBBF24" rx="2" />
                            <Rect x="-4" y="-10" width="8" height="3" fill="#FFFFFF" opacity="0.8" />
                            <Circle cx="-2" cy="-2" r="1.5" fill="#F59E0B" />
                            <Circle cx="2" cy="-2" r="1.5" fill="#F59E0B" />
                            <Circle cx="0" cy="2" r="1.5" fill="#F59E0B" />
                            <Circle cx="-2" cy="6" r="1.5" fill="#F59E0B" />
                            <Circle cx="2" cy="6" r="1.5" fill="#F59E0B" />
                        </G>

                        {/* Bottom shelf - Canned goods */}
                        <G transform="translate(-40, 5)">
                            {/* Soup can */}
                            <Rect x="-6" y="-10" width="12" height="20" fill="#DC2626" rx="6" />
                            <Ellipse cx="0" cy="-10" rx="6" ry="2" fill="#EF4444" />
                            <Ellipse cx="0" cy="10" rx="6" ry="2" fill="#B91C1C" />
                            <Rect x="-4" y="-5" width="8" height="3" fill="#FFFFFF" opacity="0.9" />
                            <Text x="0" y="-3" textAnchor="middle" fontSize="4" fill="#DC2626">SOUP</Text>
                        </G>

                        <G transform="translate(0, 5)">
                            {/* Tomato can */}
                            <Rect x="-6" y="-10" width="12" height="20" fill="#EF4444" rx="6" />
                            <Ellipse cx="0" cy="-10" rx="6" ry="2" fill="#F87171" />
                            <Ellipse cx="0" cy="10" rx="6" ry="2" fill="#DC2626" />
                            <Circle cx="0" cy="0" r="4" fill="#FFFFFF" opacity="0.9" />
                            <Circle cx="0" cy="0" r="3" fill="#EF4444" />
                        </G>

                        <G transform="translate(40, 5)">
                            {/* Beans can */}
                            <Rect x="-6" y="-10" width="12" height="20" fill="#059669" rx="6" />
                            <Ellipse cx="0" cy="-10" rx="6" ry="2" fill="#10B981" />
                            <Ellipse cx="0" cy="10" rx="6" ry="2" fill="#047857" />
                            <Rect x="-4" y="-2" width="8" height="4" fill="#FFFFFF" opacity="0.9" />
                            <Text x="0" y="0" textAnchor="middle" fontSize="4" fill="#059669">BEANS</Text>
                        </G>
                    </G>

                    {/* Floating inventory icons */}
                    <G opacity="0.7">
                        {/* Checkmark for organization */}
                        <Circle cx="-90" cy="-40" r="12" fill={Colors.secondaryColor} opacity="0.2" />
                        <Path d="M-95,-43 L-90,-38 L-85,-48" stroke={Colors.secondaryColor} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Calendar for expiry tracking */}
                        <Rect x="75" y="-50" width="20" height="16" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" rx="2" />
                        <Rect x="75" y="-50" width="20" height="4" fill="#3B82F6" rx="2" />
                        <Circle cx="80" cy="-52" r="1" fill="#FFFFFF" />
                        <Circle cx="90" cy="-52" r="1" fill="#FFFFFF" />
                        <Rect x="77" y="-44" width="2" height="2" fill="#E5E7EB" />
                        <Rect x="81" y="-44" width="2" height="2" fill="#E5E7EB" />
                        <Rect x="85" y="-44" width="2" height="2" fill="#EF4444" />
                        <Rect x="89" y="-44" width="2" height="2" fill="#E5E7EB" />

                        {/* Notification bell */}
                        <Circle cx="-90" cy="40" r="10" fill="#FBBF24" opacity="0.2" />
                        <Path d="M-95,35 Q-90,30 -85,35 Q-85,40 -90,45 Q-95,40 -95,35 Z" fill="#FBBF24" />
                        <Path d="M-92,47 Q-90,49 -88,47" stroke="#FBBF24" strokeWidth="2" fill="none" strokeLinecap="round" />
                        <Circle cx="-87" cy="32" r="2" fill="#EF4444" />

                        {/* Plus for adding items */}
                        <Circle cx="90" cy="35" r="12" fill={Colors.secondaryColor} opacity="0.2" />
                        <Path d="M90,25 L90,45 M80,35 L100,35" stroke={Colors.secondaryColor} strokeWidth="3" strokeLinecap="round" />
                    </G>
                </G>

                {/* Floating particles */}
                <G opacity="0.5">
                    <Circle cx="60" cy="70" r="1.5" fill="#10B981" />
                    <Circle cx="220" cy="90" r="1" fill="#FBBF24" />
                    <Circle cx="50" cy="230" r="2" fill="#F87171" />
                    <Circle cx="230" cy="210" r="1.5" fill="#3B82F6" />
                </G>
            </Svg>
        </View>
    );
}

export default function InventoryScreen(props: OnboardingScreenProps) {
    const { t } = useTranslation();

    return (
        <OnboardingScreen
            {...props}
            illustration={<InventoryIllustration />}
            title={t('onboarding_inventory_title')}
            subtitle={t('onboarding_inventory_subtitle')}
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