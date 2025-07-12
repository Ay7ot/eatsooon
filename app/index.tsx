import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../src/services/AuthContext';

export default function IndexScreen() {
    const { user, isLoading } = useAuth();

    useEffect(() => {
        console.log('IndexScreen - auth state changed:', {
            user: user?.email || 'no user',
            isLoading
        });
    }, [user, isLoading]);

    console.log('IndexScreen - rendering with:', {
        user: user?.email || 'no user',
        isLoading
    });

    if (isLoading) {
        console.log('IndexScreen - showing loading state');
        return null; // Or a loading screen
    }

    if (user) {
        console.log('IndexScreen - user authenticated, redirecting to tabs');
        return <Redirect href="/(tabs)" />;
    }

    console.log('IndexScreen - no user, redirecting to sign-in');
    return <Redirect href="/sign-in" />;
} 