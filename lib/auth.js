// lib/auth.js — Auth context & hook

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, getUserProfile, createUserProfile } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let prof = await getUserProfile(firebaseUser.uid);
        if (!prof) {
          await createUserProfile(firebaseUser.uid, {
            name:  firebaseUser.displayName || "User",
            email: firebaseUser.email,
            photo: firebaseUser.photoURL || null,
          });
          prof = await getUserProfile(firebaseUser.uid);
        }
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
