import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  verifyAccount: (email: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  credits: number;
  refreshCredits: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);

  const refreshCredits = async () => {
    if (!auth.currentUser) return;
    try {
      const response = await fetch("/api/user/credits");
      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (error) {
      console.error("[Auth] Failed to refresh credits:", error);
    }
  };

  useEffect(() => {
    console.log("[Auth] Setting up onAuthStateChanged listener...");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("[Auth] State changed. User:", user ? user.email : "none");
      setUser(user);
      setLoading(false);
      if (user) {
        refreshCredits();
      } else {
        setCredits(0);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        pass,
      );
      const user = userCredential.user;

      // Relax email verification - we no longer block login
      // We will show a notice in the Profile/Dashboard instead
      if (!user.emailVerified) {
        console.log("[Auth] User logged in but email is unverified.");
      }
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const signup = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      // Call our backend to send the Mailjet verification code
      await fetch("/api/auth/send-verification-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error("Signup Error:", error);
      throw error;
    }
  };

  const verifyAccount = async (email: string, otp: string) => {
    try {
      const response = await fetch("/api/auth/verify-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      return !!data.success;
    } catch (error) {
      console.error("Verification Error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithEmail,
        signup,
        verifyAccount,
        logout,
        credits,
        refreshCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
