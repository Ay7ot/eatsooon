import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';

export function AuthGate({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) {
            return; // Don't do anything until loading is complete
        }

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // User is not signed in and not on auth screen, redirect to sign-in
            console.log('AuthGate - No user and not in auth group, redirecting to sign-in');
            router.replace('/(auth)/sign-in');
        }
    }, [user, segments, isLoading, router]);

    return <>{children}</>;
} 