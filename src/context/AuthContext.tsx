import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userPlan: string;
  claimedSignupCredits: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  claimSignupCredits: () => Promise<boolean>;
  verifyAccount: (email: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  credits: number;
  refreshCredits: () => Promise<void>;
  deductCredits: (amount: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number>(0);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [claimedSignupCredits, setClaimedSignupCredits] = useState<boolean>(false);

  const initUserInDB = async (uid: string, email: string | null, name: string | null) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: email || "",
          name: name || "",
          credits: 15,
          plan: "free",
          claimedSignupCredits: false,
          admin: false,
          createdAt: serverTimestamp(),
        });
        console.log("[Auth] User initialized in Firestore.");
      }
    } catch (error) {
      console.error("[Auth] Error initializing user in DB:", error);
    }
  };

  const refreshCredits = async () => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setCredits(data.credits || 0);
        setUserPlan(data.plan || "free");
        setIsAdmin(!!data.admin);
        setClaimedSignupCredits(!!data.claimedSignupCredits);
      }
    } catch (error) {
      console.error("[Auth] Failed to refresh credits:", error);
    }
  };

  const claimSignupCredits = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (!data.claimedSignupCredits) {
          const newCredits = (data.credits || 0) + 50;
          await setDoc(userRef, { credits: newCredits, claimedSignupCredits: true }, { merge: true });
          setCredits(newCredits);
          setClaimedSignupCredits(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("[Auth] Failed to claim signup credits:", error);
      return false;
    }
  };

  const deductCredits = async (amount: number): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const currentCredits = snap.data().credits || 0;
        if (currentCredits >= amount) {
          await setDoc(userRef, { credits: currentCredits - amount }, { merge: true });
          setCredits(currentCredits - amount);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("[Auth] Failed to deduct credits:", error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        await refreshCredits();
      } else {
        setCredits(0);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await initUserInDB(result.user.uid, result.user.email, result.user.displayName);
      await refreshCredits();
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

      if (!user.emailVerified) {
        console.log("[Auth] User logged in but email is unverified.");
      }
      await refreshCredits();
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const signup = async (email: string, pass: string, name?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      await initUserInDB(result.user.uid, email, name || "");
      await refreshCredits();

      // Trigger official Firebase Email Verification
      try {
        await sendEmailVerification(result.user);
        console.log("[Auth] Firebase verification email sent to", email);
      } catch (e) {
        console.warn("[Auth] Firebase verification email warning:", e);
      }

      // Call backend verification OTP as fallback
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

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("[Auth] Firebase password reset email sent to", email);
    } catch (error) {
      console.error("Password Reset Error:", error);
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        console.log("[Auth] Firebase verification email resent.");
      } else {
        throw new Error("No authenticated user found.");
      }
    } catch (error) {
      console.error("Verification Email Error:", error);
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
      localStorage.clear();
      sessionStorage.clear();
      // Hard redirect to landing page to fully reset all React state
      window.location.href = "/";
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
        isAdmin,
        userPlan,
        claimedSignupCredits,
        login,
        loginWithEmail,
        signup,
        resetPassword,
        sendVerificationEmail,
        claimSignupCredits,
        verifyAccount,
        logout,
        credits,
        refreshCredits,
        deductCredits,
      }}
    >
      {!loading && children}
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
