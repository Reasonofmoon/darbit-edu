'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth as getAuth, db as getDb } from './firebase';

export type UserRole = 'teacher' | 'student' | 'parent' | 'admin';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    academyId?: string;
    createdAt?: Date;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    demoMode: boolean;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_PROFILE: UserProfile = {
    uid: 'demo-teacher-001',
    email: 'demo@dalbit.edu',
    displayName: '달빛 선생님',
    role: 'teacher',
    academyId: 'dalbit-demo',
};

function isFirebaseConfigured(): boolean {
    const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    return !!key && key !== 'your-firebase-api-key' && key.length > 10;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [demoMode, setDemoMode] = useState(false);

    useEffect(() => {
        // Check if Firebase is configured
        if (!isFirebaseConfigured()) {
            console.info('[DalbitEdu] Firebase API key not configured — running in DEMO MODE');
            setDemoMode(true);
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    const profileDoc = await getDoc(doc(getDb(), 'users', firebaseUser.uid));
                    if (profileDoc.exists()) {
                        setProfile(profileDoc.data() as UserProfile);
                    } else {
                        const newProfile: UserProfile = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || '',
                            displayName: firebaseUser.displayName || '',
                            photoURL: firebaseUser.photoURL || undefined,
                            role: 'teacher',
                        };
                        await setDoc(doc(getDb(), 'users', firebaseUser.uid), {
                            ...newProfile,
                            createdAt: serverTimestamp(),
                        });
                        setProfile(newProfile);
                    }
                } catch (err) {
                    console.error('Firestore profile error:', err);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const enterDemoMode = () => {
        setDemoMode(true);
        setProfile(DEMO_PROFILE);
        setUser({ uid: 'demo-teacher-001' } as User);
    };

    const signInWithGoogle = async () => {
        if (demoMode || !isFirebaseConfigured()) { enterDemoMode(); return; }
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getAuth(), provider);
    };

    const signInWithEmail = async (email: string, password: string) => {
        if (demoMode || !isFirebaseConfigured()) { enterDemoMode(); return; }
        await signInWithEmailAndPassword(getAuth(), email, password);
    };

    const signUpWithEmail = async (email: string, password: string, displayName: string) => {
        if (demoMode || !isFirebaseConfigured()) { enterDemoMode(); return; }
        const cred = await createUserWithEmailAndPassword(getAuth(), email, password);
        const newProfile: UserProfile = {
            uid: cred.user.uid,
            email,
            displayName,
            role: 'teacher',
        };
        await setDoc(doc(getDb(), 'users', cred.user.uid), {
            ...newProfile,
            createdAt: serverTimestamp(),
        });
    };

    const signOut = async () => {
        if (demoMode) {
            setDemoMode(false);
            setUser(null);
            setProfile(null);
            return;
        }
        await firebaseSignOut(getAuth());
    };

    return (
        <AuthContext.Provider
            value={{ user, profile, loading, demoMode, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
