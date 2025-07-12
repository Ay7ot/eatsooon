# Eat-Soon React Native Implementation Plan

This document outlines the step-by-step plan to rebuild the "Eat Soon" application using React Native and Expo, replicating the functionality of the original Flutter application.

## Phase 1: Project Setup & Core Foundation

This phase focuses on establishing a solid foundation for the application.

- [x] **1. Verify Expo Project Setup:**
    -   Confirm that the initial Expo project is correctly configured to run on both iOS and Android simulators/devices.

- [x] **2. Establish Directory Structure:**
    -   Create a scalable project structure to organize files logically.
    -   `src/screens`: For screen components.
    -   `src/components`: For reusable UI components.
    -   `src/navigation`: For navigation setup (stacks, tabs).
    -   `src/services`: For business logic and API calls (e.g., Firebase).
    -   `src/hooks`: For custom React hooks.
    -   `src/assets`: For images, fonts, and other static assets.
    -   `src/constants`: For theme, colors, and other constants.
    -   `src/store`: For state management.
    -   `src/utils`: For helper functions.


- [x] **3. Install Core Dependencies:**
    -   `@react-navigation/native`
    -   `@react-navigation/native-stack`
    -   `@react-navigation/bottom-tabs`
    -   `firebase`
    -   `expo-font`
    -   `expo-asset`
    -   `@reduxjs/toolkit`
    -   `react-redux`

- [x] **4. Set up Firebase:**
    -   Connect to the existing Firebase project.
    -   Configure Firebase for both Android and iOS in the Expo project by setting up `firebase.js` with the project credentials.
    -   Deploy the `firebase.rules` to Firestore.

- [x] **5. Manage Assets:**
    -   Copy the `Inter` and `Nunito` font families from the Flutter project's assets to `eatsooon/src/assets/fonts`.
    -   Copy essential images, icons, and Lottie animations.

- [x] **6. Define Theme and Styling:**
    -   Create a `theme.js` file in `src/constants` to define the color palette, typography (font sizes, weights), and spacing, based on the original app's theme.

## Phase 2: Authentication

This phase implements the user authentication flow.

- [x] **7. Build Authentication UI:**
    -   Create screens for:
        -   Sign In (with email/password and Google Sign-In).
        -   Sign Up.
        -   Forgot Password.

- [x] **8. Implement Firebase Authentication:**
    -   Set up Firebase Authentication for email/password and Google Sign-In.
    -   Create services to handle user registration, login, and sign-out.

- [x] **9. Create Authentication Flow:**
    -   Implement a navigation flow that directs users to the main app if authenticated, or to the login screen if not. This will act as the `AuthWrapper`.

## Phase 3: Core Application Features

This phase builds the main functionalities of the app.

- [x] **10. Set up Main Navigation:**
    - Implemented bottom tab navigator with screens: Home, Inventory, Scan, Recipes, Profile.

- [x] **11. Build the Home Screen:**
    - Recreated statistics cards, quick actions, recent activity component, and family members section to match Flutter UI.

- [x] **12. Implement Firestore Integration for Inventory:**
    - Added `FoodItem` model and `InventoryService` with real-time Firestore streams and CRUD helpers.
    - Home screen now listens to inventory items for live statistics.

- [x] **16. Build Inventory Screen:**
    - Created full inventory management UI with statistics cards, filter tabs, search functionality.
    - Implemented real-time item display with status badges, category emojis, and expiration tracking.
    - Added skeleton loading states and responsive design matching Flutter UI.

- [ ] **13. Implement Product Scanning:**
    -   Integrate `expo-barcode-scanner`