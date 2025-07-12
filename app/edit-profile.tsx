import CustomAppBar from '@/components/ui/CustomAppBar';
import LoadingButton from '@/components/ui/LoadingButton';
import Toast from '@/components/ui/Toast';
import { Typography } from '@/components/ui/Typography';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/src/services/AuthContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';

export default function EditProfileScreen() {
    const { user, updateUserProfile } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();

    const [name, setName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState(''); // TODO: Add bio to user model

    const [nameError, setNameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
        message: '',
        type: 'success',
        visible: false,
    });

    const validateName = (text: string) => {
        if (!text) return t('edit_profile_name_required');
        return null;
    };

    const validateEmail = (text: string) => {
        if (!text) return t('edit_profile_email_required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return t('edit_profile_email_invalid');
        return null;
    };

    const handleSaveChanges = async () => {
        const nameErr = validateName(name);
        const emailErr = validateEmail(email);

        setNameError(nameErr);
        setEmailError(emailErr);

        if (nameErr || emailErr) {
            return;
        }

        setIsLoading(true);
        try {
            await updateUserProfile(name);
            setToast({
                message: t('edit_profile_updated_success'),
                type: 'success',
                visible: true,
            });
            // Navigate back after successful update
            setTimeout(() => {
                router.back();
            }, 1000);
        } catch (error) {
            setToast({
                message: t('edit_profile_update_error') + (error as Error).message,
                type: 'error',
                visible: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <Toast
                message={toast.message}
                type={toast.type}
                visible={toast.visible}
                onHide={() => setToast(prev => ({ ...prev, visible: false }))}
            />
            <CustomAppBar title="Eatsooon" />

            {/* Sub-header */}
            <View style={styles.subHeader}>
                <Pressable style={styles.backButton} onPress={handleCancel}>
                    <MaterialIcons name="arrow-back-ios" size={20} color={Colors.textSecondary} />
                </Pressable>
                <View style={styles.subHeaderContent}>
                    <Text style={[Typography.heading, { color: Colors.textPrimary, fontSize: 18 }]}>
                        {t('edit_profile_title')}
                    </Text>
                    <Text style={[Typography.subtitle, { color: Colors.textSecondary, fontSize: 14, marginTop: 2 }]}>
                        {t('edit_profile_subtitle')}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Personal Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('edit_profile_personal_info')}</Text>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('edit_profile_full_name')}</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons
                                    name="person-outline"
                                    size={20}
                                    color={Colors.textTertiary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.textInput}
                                    value={name}
                                    onChangeText={setName}
                                    placeholder=""
                                    placeholderTextColor={Colors.textTertiary}
                                />
                            </View>
                            {nameError && <Text style={styles.errorText}>{nameError}</Text>}
                        </View>
                    </View>

                    {/* Contact Information Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('edit_profile_contact_info')}</Text>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('edit_profile_email_address')}</Text>
                            <View style={[styles.inputWrapper, styles.disabledInput]}>
                                <MaterialIcons
                                    name="email"
                                    size={20}
                                    color={Colors.textTertiary}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={[styles.textInput, styles.disabledTextInput]}
                                    value={email}
                                    onChangeText={setEmail}
                                    placeholder=""
                                    placeholderTextColor={Colors.textTertiary}
                                    editable={false}
                                    keyboardType="email-address"
                                />
                            </View>
                            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                        </View>
                    </View>

                    {/* About Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('edit_profile_about')}</Text>

                        <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>{t('edit_profile_bio_optional')}</Text>
                            <View style={[styles.inputWrapper, styles.bioInputWrapper]}>
                                <MaterialIcons
                                    name="edit"
                                    size={20}
                                    color={Colors.textTertiary}
                                    style={[styles.inputIcon, styles.bioInputIcon]}
                                />
                                <TextInput
                                    style={[styles.textInput, styles.bioTextInput]}
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholder={t('edit_profile_bio_hint')}
                                    placeholderTextColor={Colors.textTertiary}
                                    multiline={true}
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <Pressable
                            style={styles.outlinedButton}
                            onPress={handleCancel}
                            disabled={isLoading}
                        >
                            <Text style={styles.outlinedButtonText}>{t('edit_profile_cancel')}</Text>
                        </Pressable>

                        <LoadingButton
                            title={t('edit_profile_save_changes')}
                            onPress={handleSaveChanges}
                            loading={isLoading}
                            style={styles.filledButton}
                        />
                    </View>

                    <View style={{ height: 32 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundColor,
    },
    subHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.backgroundWhite,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderColor,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: Colors.backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    subHeaderContent: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        backgroundColor: Colors.backgroundWhite,
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontFamily: 'Nunito-SemiBold',
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 20,
        lineHeight: 23,
    },
    fieldContainer: {
        marginBottom: 0,
    },
    fieldLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textSecondary,
        marginBottom: 8,
        lineHeight: 17,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.borderColor,
        borderRadius: 12,
        backgroundColor: Colors.backgroundWhite,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    disabledInput: {
        backgroundColor: '#F9FAFB',
        borderColor: Colors.borderColor,
    },
    bioInputWrapper: {
        alignItems: 'flex-start',
        paddingVertical: 14,
    },
    inputIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    bioInputIcon: {
        marginTop: 2,
    },
    textInput: {
        flex: 1,
        fontFamily: 'Inter-Regular',
        fontSize: 16,
        fontWeight: '400',
        color: Colors.textPrimary,
        lineHeight: 19,
        padding: 0,
        margin: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    disabledTextInput: {
        color: Colors.textTertiary,
    },
    bioTextInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 0,
    },
    outlinedButton: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.borderColor,
        backgroundColor: Colors.backgroundWhite,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: 10,
    },
    outlinedButtonText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 16,
        color: Colors.textSecondary,
    },
    filledButton: {
        flex: 1,
        borderRadius: 12,
        marginTop: 10,
    },
    errorText: {
        color: Colors.red,
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginTop: 5,
        paddingLeft: 5,
    },
}); 