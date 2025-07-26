#!/bin/bash
# This script patches the build.gradle file for react-native-text-recognition
# to align its SDK versions with the main project, fixing build errors.
# It also updates app names in native files to display "Eatsooon" instead of "eatsooon".

set -e

# Define the paths to the files that need patching
BUILD_GRADLE_PATH="node_modules/react-native-text-recognition/android/build.gradle"
ANDROID_STRINGS_PATH="android/app/src/main/res/values/strings.xml"
IOS_INFO_PLIST_PATH="ios/eatsooon/Info.plist"

echo "Starting patch process..."

# Check if the build.gradle file exists
if [ ! -f "$BUILD_GRADLE_PATH" ]; then
    echo "Patch target not found: $BUILD_GRADLE_PATH"
    echo "Please ensure node modules are installed."
    exit 1
fi

echo "Patching $BUILD_GRADLE_PATH..."

# Determine the correct sed -i syntax based on the operating system
sedi=()
if [[ "$OSTYPE" == "darwin"* ]]; then
  sedi=(-i '')
else
  sedi=(-i)
fi

# Use sed to replace the outdated SDK versions.
# The sedi variable will contain the correct flags for in-place editing.
sed "${sedi[@]}" "s/compileSdkVersion safeExtGet('TextRecognition_compileSdkVersion', 29)/compileSdkVersion safeExtGet('TextRecognition_compileSdkVersion', 34)/" "$BUILD_GRADLE_PATH"
sed "${sedi[@]}" "s/buildToolsVersion safeExtGet('TextRecognition_buildToolsVersion', '29.0.2')/buildToolsVersion safeExtGet('TextRecognition_buildToolsVersion', '34.0.0')/" "$BUILD_GRADLE_PATH"
sed "${sedi[@]}" "s/minSdkVersion safeExtGet('TextRecognition_minSdkVersion', 16)/minSdkVersion safeExtGet('TextRecognition_minSdkVersion', 23)/" "$BUILD_GRADLE_PATH"
sed "${sedi[@]}" "s/targetSdkVersion safeExtGet('TextRecognition_targetSdkVersion', 29)/targetSdkVersion safeExtGet('TextRecognition_targetSdkVersion', 34)/" "$BUILD_GRADLE_PATH"

echo "Build.gradle patch applied successfully!"

# Patch Android strings.xml to update app name
if [ -f "$ANDROID_STRINGS_PATH" ]; then
    echo "Patching $ANDROID_STRINGS_PATH..."
    # Update the app_name string from "eatsooon" to "Eatsooon"
    sed "${sedi[@]}" "s/<string name=\"app_name\">eatsooon<\/string>/<string name=\"app_name\">Eatsooon<\/string>/" "$ANDROID_STRINGS_PATH"
    echo "Android strings.xml patch applied successfully!"
else
    echo "Warning: $ANDROID_STRINGS_PATH not found. Android app name may not be updated."
fi

# Patch iOS Info.plist to update app name
if [ -f "$IOS_INFO_PLIST_PATH" ]; then
    echo "Patching $IOS_INFO_PLIST_PATH..."
    # Update the CFBundleDisplayName value from "eatsooon" to "Eatsooon"
    sed "${sedi[@]}" "s/<string>eatsooon<\/string>/<string>Eatsooon<\/string>/" "$IOS_INFO_PLIST_PATH"

    # Update the NSCameraUsageDescription to be more descriptive
    sed "${sedi[@]}" "s|<string>Allow \\\$(PRODUCT_NAME) to access your camera</string>|<string>To help you quickly add items to your inventory, our app uses your camera to scan barcodes and automatically identify products. You can also scan the expiry date on your food items to get timely reminders before they go bad.</string>|" "$IOS_INFO_PLIST_PATH"
    
    echo "iOS Info.plist patch applied successfully!"
else
    echo "Warning: $IOS_INFO_PLIST_PATH not found. iOS app name may not be updated."
fi

echo "All patches applied successfully!" 