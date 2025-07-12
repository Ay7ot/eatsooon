/**
 * Exact colors from the Figma design for pixel-perfect implementation.
 * Sourced from: eatsoon/lib/core/theme/app_theme.dart
 */
export const Colors = {
  // Primary Colors - Green theme
  primaryColor: '#2C7D4A', // Dark green - primary color
  secondaryColor: '#0DE26D', // Bright green - secondary color
  accentColor: '#FDE28E', // Yellow accent

  // Status Colors
  orange: '#F97316', // Orange for tomorrow/warning
  red: '#EF4444', // Red for today/expired
  green: '#78B242', // Green for UI elements (buttons, backgrounds)
  freshGreen: '#0DE26D', // Green for fresh food status
  greenWithOpacity: '#78B24233', // Green with 20% opacity

  // Text Colors (Gray Scale)
  textPrimary: '#1F2937', // Very dark gray for headings
  textSecondary: '#4B5563', // Medium gray for secondary text
  textTertiary: '#6B7280', // Light gray for tertiary text

  // Background Colors
  backgroundColor: '#F3F4F6', // Very light gray
  backgroundWhite: '#FFFFFF', // Pure white
  borderColor: '#E5E7EB', // Border color

  // Theme maps for legacy components expecting Colors.light/Colors.dark structure
  light: {
    text: '#1F2937', // Same as textPrimary
    background: '#F3F4F6', // Same as backgroundColor
  },
  dark: {
    text: '#FFFFFF', // fallback white text for dark mode
    background: '#000000', // fallback dark background
  },
};
