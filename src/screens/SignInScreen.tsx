import { Link, useRouter } from 'expo-router';
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

export default function SignInScreen() {
    const { signIn } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
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

    const validatePassword = (text: string) => {
        if (!text) return "Password is required.";
        if (text.length < 6) return "Password must be at least 6 characters long.";
        return null;
    };

    const handleSignIn = async () => {
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setEmailError(emailErr);
        setPasswordError(passwordErr);

        if (emailErr || passwordErr) {
            return;
        }

        console.log('SignInScreen - attempting sign in');
        setIsLoading(true);
        const success = await signIn(email, password);
        setIsLoading(false);

        console.log('SignInScreen - sign in result:', success);
        if (!success) {
            setToast({
                message: 'Invalid email or password. Please try again.',
                type: 'error',
                visible: true,
            });
        } else {
            setToast({
                message: 'Welcome back! Signing you in...',
                type: 'success',
                visible: true,
            });
            // Navigate to home after success
            router.replace('/(tabs)');
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
                <Text style={[Typography.heading, { color: Colors.textPrimary }]}>Welcome back</Text>
                <Text style={[Typography.subtitle, { color: Colors.textSecondary, marginBottom: 24 }]}>
                    Sign in to continue your inventory journey.
                </Text>

                <CustomTextField
                    hintText="Email Address"
                    controller={{ value: email, onChangeText: setEmail }}
                    keyboardType="email-address"
                    errorText={emailError}
                />

                <CustomTextField
                    hintText="Password"
                    controller={{ value: password, onChangeText: setPassword }}
                    isPassword={!isPasswordVisible}
                    suffixIcon={isPasswordVisible ? 'eye-off' : 'eye'}
                    onSuffixIconPressed={() => setIsPasswordVisible(!isPasswordVisible)}
                    errorText={passwordError}
                />

                <Link href="/(auth)/forgot-password" asChild>
                    <Pressable>
                        <Text style={styles.forgotPassword}>Forgot Password?</Text>
                    </Pressable>
                </Link>

                <LoadingButton title="Continue" onPress={handleSignIn} loading={isLoading} />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <Link href="/(auth)/sign-up" asChild>
                        <Pressable>
                            <Text style={styles.footerLink}>Sign Up</Text>
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
        backgroundColor: Colors.backgroundColor, // Changed from backgroundWhite to backgroundColor
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
    // typography handled above
    forgotPassword: {
        textAlign: 'right',
        color: Colors.textSecondary,
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        marginBottom: 20,
    },
    // button styles moved to LoadingButton
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
        color: Colors.secondaryColor, // Changed from orange to green
        fontFamily: 'Inter-Bold',
        fontSize: 14,
        marginLeft: 5,
    },
});