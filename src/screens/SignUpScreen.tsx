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

export default function SignUpScreen() {
    const { signUp } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false,
    });

    const validateName = (text: string) => {
        if (!text) return "Name is required.";
        return null;
    };

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

    const handleSignUp = async () => {
        const nameErr = validateName(name);
        const emailErr = validateEmail(email);
        const passwordErr = validatePassword(password);

        setNameError(nameErr);
        setEmailError(emailErr);
        setPasswordError(passwordErr);

        if (nameErr || emailErr || passwordErr) {
            return;
        }

        setIsLoading(true);
        const success = await signUp(email, password, name);
        setIsLoading(false);

        if (success) {
            setToast({
                message: 'Account created successfully!',
                type: 'success',
                visible: true,
            });
            // Navigate to home after success
            router.replace('/(tabs)');
        } else {
            setToast({
                message: 'Failed to create account. Please try again.',
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
                <Text style={[Typography.heading, { color: Colors.textPrimary }]}>Create Account</Text>
                <Text style={[Typography.subtitle, { color: Colors.textSecondary, marginBottom: 24 }]}>
                    Join us to start managing your inventory.
                </Text>

                <CustomTextField
                    hintText="Full Name"
                    controller={{ value: name, onChangeText: setName }}
                    errorText={nameError}
                />

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

                <LoadingButton title="Create Account" onPress={handleSignUp} loading={isLoading} />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <Link href="/(auth)/sign-in" asChild>
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