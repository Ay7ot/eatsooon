#!/bin/bash
# This script patches the build.gradle file for react-native-text-recognition
# to align its SDK versions with the main project, fixing build errors.

set -e

# Define the path to the file that needs patching
FILE_PATH="node_modules/react-native-text-recognition/android/build.gradle"

# Check if the file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Patch target not found: $FILE_PATH"
    echo "Please ensure node modules are installed."
    exit 1
fi

echo "Patching $FILE_PATH..."

# Use sed to replace the outdated SDK versions.
# The -i'' flag is used for in-place editing that works on both macOS and Linux.
sed -i'' "s/compileSdkVersion safeExtGet('TextRecognition_compileSdkVersion', 29)/compileSdkVersion safeExtGet('TextRecognition_compileSdkVersion', 35)/" "$FILE_PATH"
sed -i'' "s/buildToolsVersion safeExtGet('TextRecognition_buildToolsVersion', '29.0.2')/buildToolsVersion safeExtGet('TextRecognition_buildToolsVersion', '35.0.0')/" "$FILE_PATH"
sed -i'' "s/minSdkVersion safeExtGet('TextRecognition_minSdkVersion', 16)/minSdkVersion safeExtGet('TextRecognition_minSdkVersion', 24)/" "$FILE_PATH"
sed -i'' "s/targetSdkVersion safeExtGet('TextRecognition_targetSdkVersion', 29)/targetSdkVersion safeExtGet('TextRecognition_targetSdkVersion', 35)/" "$FILE_PATH"

echo "Patch applied successfully!" 