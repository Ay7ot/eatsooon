import { useAuth } from '@/src/services/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { user, isLoading } = useAuth();

    // Show loading spinner while checking auth state
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    // If user is authenticated, redirect to home tabs
    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    // If user is not authenticated, redirect to sign-in
    return <Redirect href="/(auth)/sign-in" />;
} 