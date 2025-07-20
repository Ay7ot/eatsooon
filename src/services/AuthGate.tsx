import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading, onboardingCompleted, isNewUser } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboarding = segments[0] === 'onboarding';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/sign-in');
        } else if (user) {
            if (isNewUser && !onboardingCompleted && !inOnboarding) {
                router.replace('/onboarding');
            } else if (!isNewUser && onboardingCompleted && (inAuthGroup || inOnboarding)) {
                router.replace('/(tabs)');
            } else if (!isNewUser && !onboardingCompleted && (inAuthGroup || inOnboarding)) {
                // This is for existing users who haven't finished onboarding for some reason.
                // We can decide to send them to onboarding or home. For now, home.
                router.replace('/(tabs)');
            } else if (onboardingCompleted && (inAuthGroup || inOnboarding)) {
                router.replace('/(tabs)');
            }
        }
    }, [user, onboardingCompleted, segments, isLoading, router, isNewUser]);

    return <>{children}</>;
} 