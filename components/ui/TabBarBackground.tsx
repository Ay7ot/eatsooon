import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

// Light themed background for Android and web
export default function TabBarBackground() {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: Colors.backgroundWhite,
        }
      ]}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
