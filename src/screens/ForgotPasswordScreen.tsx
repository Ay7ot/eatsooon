import { Link } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false,
    });

    const validateEmail = (text: string) => {
        if (!text) return t('reset_password_email_required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return t('reset_password_email_invalid');
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
                message: t('reset_password_email_sent'),
                type: 'success',
                visible: true,
            });
        } else {
            setToast({
                message: t('reset_password_email_failed'),
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
                <Text style={[Typography.heading, { color: Colors.textPrimary }]}>{t('reset_password_title')}</Text>
                <Text style={[Typography.subtitle, { color: Colors.textSecondary, marginBottom: 24 }]}>{t('reset_password_description')}</Text>

                <CustomTextField
                    hintText={t('reset_password_email_label')}
                    controller={{ value: email, onChangeText: setEmail }}
                    keyboardType="email-address"
                    errorText={emailError}
                />

                <LoadingButton title={t('reset_password_send')} onPress={handleResetPassword} loading={isLoading} />

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('login_continue')}</Text>
                    <Link href="/(auth)/sign-in" asChild>
                        <Pressable>
                            <Text style={styles.footerLink}>{t('login_title')}</Text>
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