import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import CustomTextField from '../../components/ui/CustomTextField';
import LoadingButton from '../../components/ui/LoadingButton';
import Toast from '../../components/ui/Toast';
import { Typography } from '../../components/ui/Typography';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../services/AuthContext';

export default function ForgotPasswordScreen() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false,
    });

    const validateEmail = (text: string) => {
        if (!text) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return "Please enter a valid email.";
        return null;
    };

    const handleResetPassword = async () => {
        const emailErr = validateEmail(email);
        setEmailError(emailErr);

        if (emailErr) {
            return;
        }

        setIsLoading(true);
        const success = await resetPassword(email);
        setIsLoading(false);

        if (success) {
            setToast({
                message: 'Password reset email sent!',
                type: 'success',
                visible: true,
            });
        } else {
            setToast({
                message: 'Failed to send reset email. Please try again.',
                type: 'error',
                visible: true,
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
                <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[Typography.heading, { color: Colors.textPrimary }]}>Reset Password</Text>
                <Text style={[Typography.subtitle, { color: Colors.textSecondary, marginBottom: 24 }]}>
                    Enter your email address and we'll send you a link to reset your password.
                </Text>

                <CustomTextField
                    hintText="Email Address"
                    controller={{ value: email, onChangeText: setEmail }}
                    keyboardType="email-address"
                    errorText={emailError}
                />

                <LoadingButton title="Send Reset Link" onPress={handleResetPassword} loading={isLoading} />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password?</Text>
                    <Link href="/sign-in" asChild>
                        <Pressable>
                            <Text style={styles.footerLink}>Sign In</Text>
                        </Pressable>
                    </Link>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    logo: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        marginBottom: 40,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    footerText: {
        color: Colors.textTertiary,
        fontFamily: 'Inter-Regular',
        fontSize: 14,
    },
    footerLink: {
        color: Colors.secondaryColor,
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        marginLeft: 5,
    },
}); 