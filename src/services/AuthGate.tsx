import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading, onboardingCompleted } = useAuth();
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
            if (!onboardingCompleted && !inOnboarding) {
                router.replace('/onboarding');
            } else if (onboardingCompleted && (inAuthGroup || inOnboarding)) {
                router.replace('/(tabs)');
            }
        }
    }, [user, onboardingCompleted, segments, isLoading, router]);

    return <>{children}</>;
} 