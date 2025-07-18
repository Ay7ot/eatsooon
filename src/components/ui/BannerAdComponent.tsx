import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
    const [adLoaded, setAdLoaded] = useState(false);
    const [adError, setAdError] = useState<string | null>(null);

    const handleAdLoaded = () => {
        console.log('Banner ad loaded successfully');
        setAdLoaded(true);
        setAdError(null);
    };

    const handleAdError = (error: any) => {
        console.error('Banner ad failed to load:', error);
        setAdError(error.message || 'Ad failed to load');
        setAdLoaded(false);
    };

    const adUnitId = adMobService.getBannerAdUnitId();
    console.log('BannerAdComponent - Using ad unit ID:', adUnitId);

    return (
        <View style={[styles.container, style]}>
            {adError && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Ad not available</Text>
                </View>
            )}
            <BannerAd
                unitId={adUnitId}
                size={size}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: true,
                    keywords: ['food', 'cooking', 'recipes', 'pantry', 'inventory'],
                }}
                onAdLoaded={handleAdLoaded}
                onAdFailedToLoad={handleAdError}
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
    errorContainer: {
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    errorText: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
    },
}); 