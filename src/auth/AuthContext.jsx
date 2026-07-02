import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, isFirebaseConfigured } from '../config/firebase.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  async function login(email, password) {
    if (!auth) {
      return null;
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function logout() {
    if (auth) {
      await signOut(auth);
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isFirebaseConfigured,
      isAuthenticated: !isFirebaseConfigured || Boolean(user),
      displayName: user?.displayName || user?.email || 'Local Preview',
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
