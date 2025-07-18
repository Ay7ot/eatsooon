import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, View, ViewStyle } from 'react-native';

interface RecipeImageProps {
    imageUrl?: string;
    style?: ImageStyle;
    containerStyle?: ViewStyle;
    fallbackIcon?: keyof typeof Ionicons.glyphMap;
    fallbackColor?: string;
}

export default function RecipeImage({
    imageUrl,
    style,
    containerStyle,
    fallbackIcon = 'restaurant-outline',
    fallbackColor = '#6B7280'
}: RecipeImageProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    if (imageError || !imageUrl) {
        return (
            <View style={[containerStyle, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons
                    name={fallbackIcon}
                    size={32}
                    color={fallbackColor}
                />
            </View>
        );
    }

    return (
        <View style={containerStyle}>
            <Image
                source={{ uri: imageUrl }}
                style={style}
                resizeMode="cover"
                onLoad={handleImageLoad}
                onError={handleImageError}
            />
            {imageLoading && (
                <View style={[containerStyle, { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' }]}>
                    <ActivityIndicator size="small" color="#6B7280" />
                </View>
            )}
        </View>
    );
} 