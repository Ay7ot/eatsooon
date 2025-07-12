import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    visible: boolean;
    onHide: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type,
    visible,
    onHide,
    duration = 3000,
}) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            // Show toast
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View
                style={[
                    styles.toast,
                    type === 'success' ? styles.successToast : styles.errorToast,
                ]}
            >
                <Text style={styles.message}>{message}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        zIndex: 1000,
        alignItems: 'center',
    },
    toast: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        maxWidth: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    successToast: {
        backgroundColor: Colors.green,
    },
    errorToast: {
        backgroundColor: Colors.red,
    },
    message: {
        color: Colors.backgroundWhite,
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        textAlign: 'center',
    },
});

export default Toast; 