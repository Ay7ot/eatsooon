import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface LoadingButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
    variant?: 'primary' | 'secondary';
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
    title,
    onPress,
    loading = false,
    style,
    textStyle,
    disabled = false,
    variant = 'primary',
}) => {
    const backgroundColor =
        variant === 'primary' ? Colors.secondaryColor : Colors.primaryColor;
    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                { backgroundColor },
                style,
                (pressed || loading || disabled) && { opacity: 0.8 },
            ]}
            onPress={!loading && !disabled ? onPress : undefined}
            disabled={loading || disabled}
        >
            {loading ? (
                <ActivityIndicator color={Colors.backgroundWhite} />
            ) : (
                <Text style={[styles.buttonText, textStyle]}>{title}</Text>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: Colors.backgroundWhite,
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
});

export default LoadingButton; 