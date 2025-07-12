import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface CustomTextFieldProps {
    hintText: string;
    controller: {
        value: string;
        onChangeText: (text: string) => void;
    };
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    isPassword?: boolean;
    validator?: (value: string) => string | null;
    focusNode?: any;
    suffixIcon?: string;
    onSuffixIconPressed?: () => void;
    errorText?: string | null;
}

const CustomTextField: React.FC<CustomTextFieldProps> = ({
    hintText,
    controller,
    keyboardType = 'default',
    isPassword = false,
    suffixIcon,
    onSuffixIconPressed,
    errorText,
}) => {
    return (
        <View style={styles.container}>
            <TextInput
                style={[styles.input, errorText ? styles.inputError : null]}
                placeholder={hintText}
                placeholderTextColor={Colors.textTertiary}
                value={controller.value}
                onChangeText={controller.onChangeText}
                keyboardType={keyboardType}
                secureTextEntry={isPassword}
                autoCapitalize="none"
            />
            {suffixIcon && (
                <Pressable onPress={onSuffixIconPressed} style={styles.suffixIcon}>
                    <Feather name={suffixIcon as any} size={24} color={Colors.textTertiary} />
                </Pressable>
            )}
            {errorText && <Text style={styles.errorText}>{errorText}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: Colors.backgroundWhite, // Changed from backgroundLight to backgroundWhite
        borderRadius: 10,
        paddingHorizontal: 20,
        paddingVertical: 15,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: Colors.textPrimary,
        borderWidth: 1,
        borderColor: Colors.borderColor, // Changed from transparent to borderColor
    },
    inputError: {
        borderColor: Colors.red,
    },
    suffixIcon: {
        position: 'absolute',
        right: 15,
        top: 15,
    },
    errorText: {
        color: Colors.red,
        fontSize: 12,
        marginTop: 5,
        paddingLeft: 5,
    },
});

export default CustomTextField; 