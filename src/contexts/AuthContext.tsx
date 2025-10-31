'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { User, UserRole } from '@/types';
import { getDocument } from '@/db/operations';
import { COLLECTIONS } from '@/constants';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setError(null);

      if (user) {
        try {
          // Fetch user data from Firestore
          const userData = await getDocument<User>(
            COLLECTIONS.USERS,
            user.uid
          );

          if (userData) {
            setCurrentUser(userData);
          } else {
            setError('User profile not found');
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load user profile');
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    firebaseUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}

/**
 * Hook to check if user has specific role
 */
export function useRole(): (role: UserRole | UserRole[]) => boolean {
  const { currentUser } = useAuth();

  return (role: UserRole | UserRole[]) => {
    if (!currentUser) return false;

    if (Array.isArray(role)) {
      return role.includes(currentUser.role);
    }

    return currentUser.role === role;
  };
}
