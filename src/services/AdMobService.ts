import { Platform } from 'react-native';
import mobileAds, {
    AdEventType,
    InterstitialAd,
    TestIds
} from 'react-native-google-mobile-ads';

// Test Ad Unit IDs (replace with real ones for production)
const TEST_AD_UNITS = {
    banner: TestIds.BANNER,
    interstitial: TestIds.INTERSTITIAL,
};

// Production Ad Unit IDs (you'll get these from AdMob console)
const PRODUCTION_AD_UNITS = {
    banner: {
        android: 'ca-app-pub-9752685758154877/8024442552',
        ios: 'ca-app-pub-9752685758154877/2388972496'
    },
    interstitial: {
        android: 'ca-app-pub-9752685758154877/7843429405',
        ios: 'ca-app-pub-9752685758154877/4519262061'
    },
};

// Helper function to get the correct ad unit ID
const getAdUnitId = (type: 'banner' | 'interstitial'): string => {
    if (__DEV__) {
        return TEST_AD_UNITS[type];
    }
    return Platform.OS === 'ios' ? PRODUCTION_AD_UNITS[type].ios : PRODUCTION_AD_UNITS[type].android;
};

class AdMobService {
    private static _instance: AdMobService;
    private interstitialAd: InterstitialAd | null = null;
    private isInitialized = false;

    static get instance() {
        if (!AdMobService._instance) {
            AdMobService._instance = new AdMobService();
        }
        return AdMobService._instance;
    }

    private constructor() { }

    /**
     * Initialize AdMob SDK
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            await mobileAds().initialize();
            this.isInitialized = true;
            console.log('AdMob initialized successfully');

            // Preload first interstitial ad
            this.loadInterstitialAd();
        } catch (error) {
            console.error('Failed to initialize AdMob:', error);
        }
    }

    /**
     * Get banner ad unit ID
     */
    getBannerAdUnitId(): string {
        return getAdUnitId('banner');
    }

    /**
     * Load interstitial ad
     */
    async loadInterstitialAd(): Promise<void> {
        try {
            if (!this.isInitialized) {
                console.log('AdMob not initialized, initializing first...');
                await this.initialize();
            }

            console.log('Creating new interstitial ad...');
            this.interstitialAd = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'), {
                requestNonPersonalizedAdsOnly: true,
                keywords: ['food', 'cooking', 'recipes', 'pantry', 'inventory'],
            });

            // Set up event listeners
            const unsubscribeLoaded = this.interstitialAd.addAdEventListener(
                AdEventType.LOADED,
                () => {
                    console.log('Interstitial ad loaded successfully');
                }
            );

            const unsubscribeError = this.interstitialAd.addAdEventListener(
                AdEventType.ERROR,
                (error) => {
                    console.error('Interstitial ad failed to load:', error);
                    this.interstitialAd = null;
                }
            );

            const unsubscribeClosed = this.interstitialAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    console.log('Interstitial ad closed');
                    this.interstitialAd = null;
                    // Load next ad in background
                    setTimeout(() => this.loadInterstitialAd(), 1000);
                }
            );

            console.log('Loading interstitial ad...');
            await this.interstitialAd.load();
        } catch (error) {
            console.error('Failed to load interstitial ad:', error);
            this.interstitialAd = null;
        }
    }

    /**
     * Show interstitial ad
     */
    async showInterstitialAd(): Promise<boolean> {
        if (!this.interstitialAd) {
            console.log('No interstitial ad available, loading one...');
            await this.loadInterstitialAd();
            // Wait a bit for the ad to load
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (this.interstitialAd) {
            try {
                console.log('Attempting to show interstitial ad...');
                await this.interstitialAd.show();
                console.log('Interstitial ad shown successfully');
                return true;
            } catch (error) {
                console.error('Failed to show interstitial ad:', error);
                this.interstitialAd = null;
                return false;
            }
        } else {
            console.log('Interstitial ad still not available after loading attempt');
            return false;
        }
    }

    /**
     * Show interstitial ad with specific triggers
     */
    async showInterstitialAdOnTrigger(trigger: 'recipe_view' | 'scan_complete' | 'item_added'): Promise<void> {
        // For testing, show ads more frequently
        const shouldShowAd = __DEV__ ? Math.random() < 0.8 : Math.random() < 0.3; // 80% chance in dev, 30% in production

        if (shouldShowAd) {
            console.log(`Attempting to show interstitial ad for trigger: ${trigger}`);

            // First try to load a new ad if none is loaded
            if (!this.interstitialAd) {
                console.log('No interstitial ad loaded, loading new one...');
                await this.loadInterstitialAd();
            }

            // Then try to show it
            const success = await this.showInterstitialAd();
            if (success) {
                console.log(`Successfully showed interstitial ad for trigger: ${trigger}`);
                // Load the next ad in the background
                this.loadInterstitialAd();
            } else {
                console.log(`Failed to show interstitial ad for trigger: ${trigger}, will try to load new ad`);
                // Try to load a new ad for next time
                this.loadInterstitialAd();
            }
        } else {
            console.log(`Skipping interstitial ad for trigger: ${trigger}`);
        }
    }
}

export const adMobService = AdMobService.instance; 