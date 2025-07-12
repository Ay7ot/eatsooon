import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    User,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, name: string) => Promise<boolean>;
    resetPassword: (email: string) => Promise<boolean>;
    updateUserProfile: (name: string) => Promise<boolean>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    signIn: async () => false,
    signUp: async () => false,
    resetPassword: async () => false,
    updateUserProfile: async () => false,
    signOut: async () => { },
});

export const useAuth = () => {
    return useContext(AuthContext);
};

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('AuthContext - auth state changed:', user?.email || 'no user');
            setUser(user);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            console.log('AuthContext - attempting sign in for:', email);
            await signInWithEmailAndPassword(auth, email, password);
            console.log('AuthContext - sign in successful');
            return true;
        } catch (error) {
            console.error("Sign in error", error);
            return false;
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: name,
            });
            return true;
        } catch (error) {
            console.error("Sign up error", error);
            return false;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            console.error("Password reset error", error);
            return false;
        }
    };

    const updateUserProfile = async (name: string) => {
        try {
            if (!auth.currentUser) {
                throw new Error("No user is currently signed in");
            }
            await updateProfile(auth.currentUser, {
                displayName: name,
            });
            console.log('AuthContext - profile updated successfully');
            return true;
        } catch (error) {
            console.error("Update profile error", error);
            return false;
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error("Sign out error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isLoading,
        signIn,
        signUp,
        resetPassword,
        updateUserProfile,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 