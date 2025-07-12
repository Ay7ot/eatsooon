import { DefaultTheme } from '@react-navigation/native';

export const COLORS = {
    primary: '#F97316', // Orange
    secondary: '#1F2937', // Dark Gray
    accent: '#78B242', // Green

    success: '#78B242',
    error: '#EF4444', // Red

    black: '#171725',
    white: '#FFFFFF',

    // Grays
    gray_dark: '#4B5563',
    gray_medium: '#6B7280',
    gray_light: '#F3F4F6',

    // Opacity
    green_opacity: '#78B24233',
};

export const SIZES = {
    // Global sizes
    base: 8,
    font: 14,
    radius: 12,
    padding: 24,
    padding2: 36,

    // Font sizes
    largeTitle: 50,
    h1: 30,
    h2: 22,
    h3: 20,
    h4: 18,
    body1: 30,
    body2: 20,
    body3: 16,
    body4: 14,
    body5: 12,

    // App-specific dimensions
    header: 18,
    primary_text: 16,
    secondary_text: 14,
    small_text: 12,
    button_text: 16,
    label: 14,
};

export const FONTS = {
    // Headers
    header: { fontFamily: 'Nunito-Bold', fontSize: SIZES.header, lineHeight: 1.2 * SIZES.header },

    // Primary Text
    primary_text: { fontFamily: 'Inter-Medium', fontSize: SIZES.primary_text, lineHeight: 1.3 * SIZES.primary_text },

    // Secondary Text
    secondary_text: { fontFamily: 'Inter-Regular', fontSize: SIZES.secondary_text, lineHeight: 1.3 * SIZES.secondary_text },

    // Small Text
    small_text: { fontFamily: 'Inter-Regular', fontSize: SIZES.small_text, lineHeight: 1.3 * SIZES.small_text },

    // Buttons
    button: { fontFamily: 'Inter-SemiBold', fontSize: SIZES.button_text, lineHeight: 1.2 * SIZES.button_text },

    // Form Labels
    label: { fontFamily: 'Inter-Medium', fontSize: SIZES.label, lineHeight: 1.2 * SIZES.label },

    // Generic font styles
    largeTitle: { fontFamily: 'Nunito-Black', fontSize: SIZES.largeTitle, lineHeight: 55 },
    h1: { fontFamily: 'Nunito-Bold', fontSize: SIZES.h1, lineHeight: 36 },
    h2: { fontFamily: 'Nunito-Bold', fontSize: SIZES.h2, lineHeight: 30 },
    h3: { fontFamily: 'Nunito-SemiBold', fontSize: SIZES.h3, lineHeight: 22 },
    h4: { fontFamily: 'Nunito-SemiBold', fontSize: SIZES.h4, lineHeight: 22 },
    body1: { fontFamily: 'Inter-Regular', fontSize: SIZES.body1, lineHeight: 36 },
    body2: { fontFamily: 'Inter-Regular', fontSize: SIZES.body2, lineHeight: 30 },
    body3: { fontFamily: 'Inter-Regular', fontSize: SIZES.body3, lineHeight: 22 },
    body4: { fontFamily: 'Inter-Regular', fontSize: SIZES.body4, lineHeight: 22 },
    body5: { fontFamily: 'Inter-Regular', fontSize: SIZES.body5, lineHeight: 22 },
    body4_bold: { fontFamily: 'Inter-SemiBold', fontSize: SIZES.body4, lineHeight: 22 },
};

export const AppTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: COLORS.primary,
        background: COLORS.white,
        text: COLORS.secondary,
        card: COLORS.white,
        border: COLORS.gray_light,
    },
};

const theme = { COLORS, SIZES, FONTS, AppTheme };

export default theme; 