# Eatsooon 🥬

**A smart pantry manager to help you reduce food waste, one meal at a time.**

Eatsooon is a mobile application built with React Native (Expo) that helps you keep track of your food inventory, get recipe suggestions for expiring items, and collaborate with your family to manage your pantry efficiently.

## ✨ Key Features

-   **🥫 Smart Inventory Management:** Easily add, edit, and track food items in your pantry. See what you have at a glance, with items automatically categorized as fresh, expiring soon, or expired.
-   **📸 AI-Powered Scanning:** Add items in a snap by scanning barcodes for product information and capturing expiration dates from packaging using your camera.
-   **👨‍👩‍👧‍👦 Family Sharing:** Create a family group to share a pantry with others. See a shared inventory and a unified activity feed, making it easy to coordinate groceries and meals.
-   **🍲 Intelligent Recipe Suggestions:** Get creative in the kitchen! Eatsooon suggests recipes based on the ingredients you already have, prioritizing items that are about to expire.
-   **🔔 Expiration Notifications:** Receive timely reminders for items that are expiring soon, so you can use them before they go to waste.
-   **📊 Activity Tracking:** Keep an eye on your household's pantry activities with a real-time feed showing who added, used, or removed items.
-   **🌐 Multi-Language Support:** The app is fully localized and supports multiple languages.

## 🚀 Tech Stack

-   **Framework:** React Native with Expo
-   **Backend & Database:** Firebase (Firestore, Authentication, Storage)
-   **Recipe API:** Spoonacular
-   **Product Information:** OpenFoodFacts API
-   **Navigation:** Expo Router
-   **State Management:** React Context API
-   **Localization:** i18next

## ⚙️ Getting Started

### Prerequisites

-   Node.js (LTS version)
-   Expo CLI (`npm install -g expo-cli`)
-   An Expo Go account and the app on your mobile device (for testing).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ay7ot/eatsooon.git
    cd eatsooon
    ```

2.  **Install dependencies:**
    This project uses `npx expo install` to ensure library versions are compatible.
    ```bash
    npx expo install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add your API keys. You can use the example file as a template:
    ```bash
    cp .env.example .env
    ```
    Your `.env` file should contain:
    ```
    SPOONACULAR_API_KEY="YOUR_SPOONACULAR_API_KEY"
    ```

4.  **Run the application:**
    ```bash
    npx expo start
    ```
    Scan the QR code with the Expo Go app on your phone.

## 📁 Project Structure

```
eatsooon/
├── app/                  # Expo Router file-based routing (screens)
│   ├── (auth)/           # Authentication screens (sign-in, sign-up)
│   └── (tabs)/           # Main app screens after login
├── assets/               # Static assets like images and fonts
├── components/           # Shared UI components
├── constants/            # Constant values (colors, styles)
├── hooks/                # Custom React hooks
├── src/                  # Core application logic
│   ├── components/       # More complex, feature-specific components
│   ├── services/         # Services for interacting with APIs (Firebase, etc.)
│   ├── models/           # Data models and types
│   ├── localization/     # i18n configuration and translations
│   └── store/            # State management logic
└── ...
```
