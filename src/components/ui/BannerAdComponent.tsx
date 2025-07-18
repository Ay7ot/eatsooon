import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adMobService } from '../../services/AdMobService';

interface BannerAdComponentProps {
    size?: BannerAdSize;
    style?: any;
}

export default function BannerAdComponent({
    size = BannerAdSize.BANNER,
    style
}: BannerAdComponentProps) {
    return (
        <View style={[styles.container, style]}>
            <BannerAd
                unitId={adMobService.getBannerAdUnitId()}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                    keywords: ['food', 'cooking', 'recipes', 'pantry', 'inventory'],
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
}); 