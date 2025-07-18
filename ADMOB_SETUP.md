# AdMob Integration Guide

This guide explains how to set up AdMob for revenue generation in the Eatsooon app.

## Current Implementation

The app uses **production ad unit IDs** for both development and production environments. This ensures consistent behavior across all builds.

## Ad Types Implemented

### 1. Banner Ads
- **Location**: Home screen (bottom)
- **Component**: `BannerAdComponent`
- **Production ID**: `ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx` (iOS) / `ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx` (Android)

### 2. Interstitial Ads
- **Triggers**: 
  - Recipe viewing (30% chance)
  - Item added to inventory (30% chance)
- **Service**: `AdMobService.showInterstitialAdOnTrigger()`
- **Production ID**: `ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx` (iOS) / `ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx` (Android)

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

### Step 4: Configuration (Already Complete)

The app is already configured with production ad unit IDs:

#### app.json Configuration