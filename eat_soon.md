**MVP Specification – App Eat Soon**

**Objective:**
Develop a mobile app called *Eat Soon* to help reduce food waste by scanning products and their expiration dates. The app should detect dates using OCR, identify products via barcode, and allow manual entry and community learning.

---

### **Key Features – MVP:**

1. **Image Input:**

   * The user takes a photo of the product or label.

2. **Dual Detection:**

   * OCR for expiration date (using Google ML Kit).
   * Barcode scanning (using Google ML Kit) with lookup via the OpenFoodFacts API.
   * If no result is found, allow manual product entry.

3. **Manual Entry + Learning:**

   * Save image + entered name in Firestore.
   * Suggest names for similar images in the future.

4. **Confirmation Screen:**

   * Display/edit: product name, expiration date, and category.

5. **Inventory:**

   * Sort by expiration date.
   * Filters: Expiring Soon, Today, Expired.
   * Edit/delete functionality.

6. **Push Notifications:**

   * Alerts for products expiring today or in 2 days (using FCM + Cloud Functions).

7. **Recipe Suggestions:**

   * Based on products nearing expiration using AI-generated recipes.
   * OpenAI integration for personalized recipe generation.
   * Default recipe collection for users without inventory items.

8. **User Authentication:**

   * Firebase Auth using email and password.

---

### **Technologies:**

* **Frontend:** Flutter
* **Backend:** Firebase (Firestore, Auth, Storage, FCM)
* **OCR:** Google ML Kit
* **Barcode Scanning:** ML Kit Barcode Scanning
* **Product API:** OpenFoodFacts
* **Recipes:** OpenAI API integration with local default recipes
* **Optional:** AutoML Vision or Roboflow
