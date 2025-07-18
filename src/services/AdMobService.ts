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
    private isAdLoaded = false;

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
                    this.isAdLoaded = true;
                }
            );

            const unsubscribeError = this.interstitialAd.addAdEventListener(
                AdEventType.ERROR,
                (error) => {
                    console.error('Interstitial ad failed to load:', error);
                    this.interstitialAd = null;
                    this.isAdLoaded = false;
                }
            );

            const unsubscribeClosed = this.interstitialAd.addAdEventListener(
                AdEventType.CLOSED,
                () => {
                    console.log('Interstitial ad closed');
                    this.interstitialAd = null;
                    this.isAdLoaded = false;
                    // Load next ad in background
                    setTimeout(() => this.loadInterstitialAd(), 1000);
                }
            );

            console.log('Loading interstitial ad...');
            this.isAdLoaded = false;
            await this.interstitialAd.load();
        } catch (error) {
            console.error('Failed to load interstitial ad:', error);
            this.interstitialAd = null;
            this.isAdLoaded = false;
        }
    }

    /**
     * Show interstitial ad
     */
    async showInterstitialAd(): Promise<boolean> {
        if (!this.interstitialAd || !this.isAdLoaded) {
            console.log('No interstitial ad available or not loaded yet');
            return false;
        }

        try {
            console.log('Attempting to show interstitial ad...');
            await this.interstitialAd.show();
            console.log('Interstitial ad shown successfully');
            this.isAdLoaded = false; // Mark as used
            return true;
        } catch (error) {
            console.error('Failed to show interstitial ad:', error);
            this.interstitialAd = null;
            this.isAdLoaded = false;
            return false;
        }
    }

    /**
 * Show interstitial ad with specific triggers
 */
    async showInterstitialAdOnTrigger(trigger: 'recipe_view' | 'scan_complete' | 'item_added'): Promise<void> {
        // Only show ads 30% of the time (or 80% in dev for testing)
        const shouldShowAd = __DEV__ ? Math.random() < 0.8 : Math.random() < 0.3;

        if (shouldShowAd) {
            console.log(`Attempting to show interstitial ad for trigger: ${trigger}`);

            // Check if we have a loaded ad ready
            if (!this.interstitialAd) {
                console.log('No ad available, loading one...');
                await this.loadInterstitialAd();
                // Wait for the ad to load
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

            const success = await this.showInterstitialAd();

            if (success) {
                console.log(`Successfully showed interstitial ad for trigger: ${trigger}`);
                // Load the next ad in the background for future use
                setTimeout(() => this.loadInterstitialAd(), 1000);
            } else {
                console.log(`Failed to show interstitial ad for trigger: ${trigger}`);
                // Try to load a new ad for next time
                setTimeout(() => this.loadInterstitialAd(), 1000);
            }
        } else {
            console.log(`Skipping interstitial ad for trigger: ${trigger} (${__DEV__ ? '80%' : '30%'} chance)`);
        }
    }
}

export const adMobService = AdMobService.instance; 