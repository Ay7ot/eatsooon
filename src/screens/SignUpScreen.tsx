import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
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
    const { t } = useTranslation();
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
        if (!text) return t('signup_name_required');
        return null;
    };

    const validateEmail = (text: string) => {
        if (!text) return t('signup_email_required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return t('signup_email_invalid');
        return null;
    };

    const validatePassword = (text: string) => {
        if (!text) return t('signup_password_required');
        if (text.length < 6) return t('signup_password_short');
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
                message: t('signup_success'),
                type: 'success',
                visible: true,
            });
            // Navigate new users to onboarding
            router.replace('/onboarding');
        } else {
            setToast({
                message: t('signup_failed'),
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
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <Image
                        source={require('../../assets/images/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={[Typography.heading, { color: Colors.textPrimary }]}>{t('signup_title')}</Text>
                    <Text style={[Typography.subtitle, { color: Colors.textSecondary, marginBottom: 24 }]}>{t('signup_subtitle')}</Text>

                    <CustomTextField
                        hintText={t('signup_name_hint')}
                        controller={{ value: name, onChangeText: setName }}
                        errorText={nameError}
                    />

                    <CustomTextField
                        hintText={t('signup_email_hint')}
                        controller={{ value: email, onChangeText: setEmail }}
                        keyboardType="email-address"
                        errorText={emailError}
                    />

                    <CustomTextField
                        hintText={t('signup_password_hint')}
                        controller={{ value: password, onChangeText: setPassword }}
                        isPassword={!isPasswordVisible}
                        suffixIcon={isPasswordVisible ? 'eye-off' : 'eye'}
                        onSuffixIconPressed={() => setIsPasswordVisible(!isPasswordVisible)}
                        errorText={passwordError}
                    />

                    <LoadingButton title={t('signup_create_button')} onPress={handleSignUp} loading={isLoading} />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>{t('signup_already_have_account')}</Text>
                        <Link href="/(auth)/sign-in" asChild>
                            <Pressable>
                                <Text style={styles.footerLink}>{t('signup_login')}</Text>
                            </Pressable>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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