import { router } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    updateProfile,
    User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { userService } from './UserService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    onboardingCompleted: boolean;
    isNewUser: boolean; // Add this
    signIn: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, name: string) => Promise<boolean>;
    resetPassword: (email: string) => Promise<boolean>;
    updateUserProfile: (name: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    completeOnboarding: () => Promise<void>;
    deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    onboardingCompleted: false,
    isNewUser: false, // Add this
    signIn: async () => false,
    signUp: async () => false,
    resetPassword: async () => false,
    updateUserProfile: async () => false,
    signOut: async () => { },
    completeOnboarding: async () => { },
    deleteAccount: async () => false,
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
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
    const [isNewUser, setIsNewUser] = useState<boolean>(false); // Add this

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setOnboardingCompleted(userData.onboardingCompleted ?? false);
                        const familyIds = userData.familyIds || [];
                        const currentFamilyId = userData.currentFamilyId;

                        if (familyIds.length > 0 && !currentFamilyId) {
                            await updateDoc(doc(db, 'users', user.uid), {
                                currentFamilyId: familyIds[0]
                            });
                            console.log(`Auto-set current family ID to: ${familyIds[0]} on app start`);
                        }
                    } else {
                        setOnboardingCompleted(false);
                    }
                } catch (error) {
                    console.error('Error checking user status on auth state change:', error);
                    setOnboardingCompleted(false);
                }
            } else {
                setOnboardingCompleted(false);
            }

            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setIsNewUser(false); // User is signing in, not new
            await signInWithEmailAndPassword(auth, email, password);

            // After successful sign in, check if user has families but no current family ID
            const user = auth.currentUser;
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const familyIds = userData.familyIds || [];
                        const currentFamilyId = userData.currentFamilyId;

                        // If user has families but no current family ID, set it to the first one
                        if (familyIds.length > 0 && !currentFamilyId) {
                            await updateDoc(doc(db, 'users', user.uid), {
                                currentFamilyId: familyIds[0]
                            });
                            console.log(`Auto-set current family ID to: ${familyIds[0]}`);
                        }
                    }
                } catch (error) {
                    // Log error but don't fail sign in - user can still use the app
                    console.error('Error checking family status after sign in:', error);
                    // Don't return false - sign in was successful
                }
            }

            return true;
        } catch (error) {
            console.error("Sign in error", error);
            return false;
        }
    };

    const signUp = async (email: string, password: string, name: string) => {
        try {
            setIsNewUser(true); // User is signing up, so they are new
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, {
                displayName: name,
            });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email: email,
                displayName: name,
                createdAt: serverTimestamp(),
                familyIds: [],
                currentFamilyId: null,
                onboardingCompleted: false,
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
            // Redirect to sign-in screen after successful sign out
            router.replace('/(auth)/sign-in');
        } catch (error) {
            console.error("Sign out error", error);
        } finally {
            setIsLoading(false);
        }
    };

    const completeOnboarding = async () => {
        if (user) {
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    onboardingCompleted: true,
                });
                setOnboardingCompleted(true);
            } catch (error) {
                console.error("Error completing onboarding:", error);
            }
        }
    };

    const deleteAccount = async () => {
        if (!user) {
            console.error('No user is signed in to delete.');
            return false;
        }

        try {
            setIsLoading(true);
            // First, delete all user data from Firestore
            await userService.deleteUserAccount(user.uid);

            // Then, delete the user from Firebase Authentication
            await deleteUser(user);

            // Sign out and redirect
            await signOut();
            return true;
        } catch (error) {
            console.error('Failed to delete account:', error);
            // If deletion fails, you might want to re-authenticate the user
            // or show a specific error message.
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isLoading,
        onboardingCompleted,
        isNewUser, // Add this
        signIn,
        signUp,
        resetPassword,
        updateUserProfile,
        signOut,
        completeOnboarding,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 