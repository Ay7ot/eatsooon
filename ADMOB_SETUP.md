# AdMob Integration Guide

This guide explains how to set up AdMob for revenue generation in the Eatsooon app.

## Current Implementation

The app currently uses **test ad unit IDs** for development. Before releasing to production, you need to replace these with real ad unit IDs from your AdMob console.

## Ad Types Implemented

### 1. Banner Ads
- **Location**: Home screen (bottom)
- **Component**: `BannerAdComponent`
- **Test ID**: `ca-app-pub-3940256099942544/6300978111`

### 2. Interstitial Ads
- **Triggers**: 
  - Recipe viewing (30% chance)
  - Item added to inventory (30% chance)
- **Service**: `AdMobService.showInterstitialAdOnTrigger()`
- **Test ID**: `ca-app-pub-3940256099942544/1033173712`

### 3. Rewarded Ads (Ready for implementation)
- **Service**: `AdMobService.showRewardedAd()`
- **Test ID**: `ca-app-pub-3940256099942544/5224354917`

## Setup Instructions

### Step 1: Create AdMob Account
1. Go to [AdMob Console](https://admob.google.com/)
2. Create a new account or sign in
3. Add your app (iOS and Android)

### Step 2: Get App IDs
1. In AdMob Console, go to **Apps** → **Add App**
2. Select your platform (iOS/Android)
3. Enter your app details
4. Copy the **App ID** (format: `ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`)

### Step 3: Create Ad Units
1. Go to **Ad Units** → **Create Ad Unit**
2. Create the following ad units:
   - **Banner Ad Unit** (for home screen)
   - **Interstitial Ad Unit** (for recipe/item actions)
   - **Rewarded Ad Unit** (for future features)

### Step 4: Update Configuration

#### Update app.json
Replace the test app IDs with your real ones:

```json
[
  "react-native-google-mobile-ads",
  {
    "android": {
      "appId": "ca-app-pub-YOUR_ANDROID_APP_ID"
    },
    "ios": {
      "appId": "ca-app-pub-YOUR_IOS_APP_ID"
    }
  }
]
```

#### Update AdMobService.ts
Replace the test ad unit IDs with your real ones:

```typescript
const PRODUCTION_AD_UNITS = {
    banner: 'ca-app-pub-YOUR_BANNER_AD_UNIT_ID',
    interstitial: 'ca-app-pub-YOUR_INTERSTITIAL_AD_UNIT_ID',
    rewarded: 'ca-app-pub-YOUR_REWARDED_AD_UNIT_ID',
};
```

### Step 5: Rebuild the App
```bash
npx expo prebuild --clean
npx expo run:ios  # or run:android
```

## Best Practices

### 1. User Experience
- **Banner ads**: Non-intrusive, always visible
- **Interstitial ads**: Only show occasionally (30% chance) to avoid overwhelming users
- **Ad frequency**: Limited to prevent poor user experience

### 2. Ad Placement Strategy
- **Home screen**: Banner ad at bottom
- **Recipe viewing**: Interstitial ad (occasionally)
- **Item addition**: Interstitial ad (occasionally)
- **Future opportunities**: 
  - Rewarded ads for premium features
  - Banner ads on other screens

### 3. Testing
- Always test with test ad unit IDs first
- Verify ad loading and display
- Test on both iOS and Android
- Check user experience flow

### 4. Compliance
- Ensure ads don't interfere with core app functionality
- Follow AdMob policies and guidelines
- Respect user privacy and GDPR compliance
- Use appropriate ad content for food/cooking apps

## Revenue Optimization

### 1. Ad Unit Optimization
- **Banner ads**: High visibility, consistent revenue
- **Interstitial ads**: Higher CPM, but use sparingly
- **Rewarded ads**: Highest CPM, user-initiated

### 2. Targeting
- Current keywords: `['food', 'cooking', 'recipes', 'pantry', 'inventory']`
- Consider adding: `['healthy', 'meal planning', 'groceries']`

### 3. A/B Testing
- Test different ad placements
- Experiment with ad frequency
- Monitor user engagement metrics

## Monitoring and Analytics

### 1. AdMob Console
- Monitor ad performance
- Track revenue metrics
- Analyze user behavior

### 2. App Analytics
- Track user retention with ads
- Monitor app performance
- Analyze user feedback

## Troubleshooting

### Common Issues
1. **Ads not showing**: Check ad unit IDs and network connectivity
2. **App crashes**: Verify app IDs are correct
3. **Low fill rate**: Check ad unit configuration and targeting

### Debug Mode
The app automatically uses test ads in development mode (`__DEV__`). In production builds, it will use real ad units.

## Next Steps

1. **Immediate**: Replace test IDs with real ones
2. **Short-term**: Add banner ads to more screens
3. **Medium-term**: Implement rewarded ads for premium features
4. **Long-term**: Optimize ad placement based on user data

## Support

For AdMob-specific issues:
- [AdMob Help Center](https://support.google.com/admob/)
- [AdMob Policy Center](https://support.google.com/admob/answer/6128543)

For app integration issues:
- Check the AdMobService.ts implementation
- Review the BannerAdComponent.tsx
- Verify app.json configuration 