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

- [ ] **10. Set up Main Navigation:**
    -   Implement a bottom tab navigator for the primary sections of the app (e.g., Home, Add Product, Profile, Families).

- [ ] **11. Build the Home Screen:**
    -   Design the UI for the main dashboard, which will display the user's personal product inventory.

- [ ] **12. Implement Firestore Integration for Inventory:**
    -   Define the database schema for the user's personal inventory (`inventory/{userId}/items/{itemId}`).
    -   Create services to perform CRUD (Create, Read, Update, Delete) operations on inventory items in Firestore.

- [ ] **13. Implement Product Scanning:**
    -   Integrate `expo-barcode-scanner` for scanning product barcodes.
    -   Research and integrate a text recognition solution to scan expiration dates from images.

- [ ] **14. Create Add/Edit Product Form:**
    -   Build a form for users to manually add or edit product details (name, expiration date, quantity, etc.).

- [ ] **15. Integrate Camera and Image Picker:**
    -   Use `expo-camera` to allow users to take photos of their products.
    -   Use `expo-image-picker` to allow users to select images from their gallery.

## Phase 4: Family System

This phase focuses on building the collaborative features of the app.

- [ ] **17. Build Family Management UI:**
    -   Create screens for:
        -   Creating a new family.
        -   Viewing family members.
        -   Inviting new members.
        -   Managing family settings (for admins).

- [ ] **18. Implement Family Firestore Logic:**
    -   Create services to handle:
        -   Creating families (`families` collection).
        -   Managing family members (`familyMembers` collection).
        -   Sending, accepting, and declining invitations (`familyInvitations` collection).

- [ ] **19. Implement Family Activity Feed:**
    -   Create a screen to display the shared activity feed for a family.
    -   Implement the logic to post and read activities from the `families/{familyId}/activities` subcollection.

- [ ] **20. Handle Family Switching (if applicable):**
    -   If users can be part of multiple families, implement UI for them to switch between active families.

## Phase 5: Notifications & Background Tasks

This phase adds the sophisticated reminder system.

- [ ] **21. Implement Notification Service:**
    -   Create a service to manage local notifications using `expo-notifications`.
    -   This service will handle requesting permissions and showing alerts.

- [ ] **22. Implement Firestore for Alert State:**
    -   Create a service to interact with the `users/{userId}/alerts` subcollection in Firestore.
    -   This will be used to save a history of notifications and manage their `read` and `visible` state, ensuring consistency across app sessions.

- [ ] **23. Implement Background Task for Notifications:**
    -   Use `expo-task-manager` to register a periodic background task that runs once or twice daily.
    -   This task will fetch the user's inventory, determine which items are expiring soon, and reconcile the notifications—showing new ones and hiding obsolete ones by updating their state in Firestore via the Alert Service.

- [ ] **24. Configure Push Notifications (for Family System):**
    -   Set up Firebase Cloud Messaging (FCM) to enable push notifications specifically for family invitations and other social interactions, as the expiration alerts are handled locally.

## Phase 6: Finalization and Polish

This phase focuses on improving the user experience and preparing the app for release.

- [ ] **25. Add UI Polish:**
    -   Implement loading indicators (e.g., shimmer effects).
    -   Create user-friendly empty states and error messages.

- [ ] **26. Implement Localization:**
    -   Integrate a library like `i18next` to support multiple languages.

- [ ] **27. Handle Permissions:**
    -   Use Expo's permission APIs to gracefully request permissions for camera, notifications, and image library access.

- [ ] **28. Conduct Thorough Testing:**
    -   Perform comprehensive testing on both physical iOS and Android devices to ensure a consistent and bug-free experience. 