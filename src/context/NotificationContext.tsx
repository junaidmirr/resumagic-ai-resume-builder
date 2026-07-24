import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "welcome" | "reward" | "system" | "verification";
  rewardAmount?: number;
  claimed?: boolean;
  read: boolean;
  timestamp: number;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  claimReward: (notif: AppNotification) => Promise<boolean>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  sendNotification: (targetUid: string, notif: Omit<AppNotification, "id" | "read" | "timestamp">) => Promise<void>;
  broadcastNotification: (notif: Omit<AppNotification, "id" | "read" | "timestamp">) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, claimedSignupCredits, claimSignupCredits, refreshCredits } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Subscribe to Firestore notifications for current user
    const notifRef = collection(db, "users", user.uid, "notifications");
    const q = query(notifRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs: AppNotification[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "Notification",
            message: data.message || "",
            type: data.type || "system",
            rewardAmount: data.rewardAmount || 0,
            claimed: !!data.claimed,
            read: !!data.read,
            timestamp: data.timestamp?.seconds ? data.timestamp.seconds * 1000 : Date.now(),
          };
        });

        // If email is verified and user hasn't claimed signup credits yet and hasn't dismissed it, check if we need to create it!
        const isDismissed = localStorage.getItem(`dismissed_verification_${user.uid}`) === "true";
        const hasCreatedBefore = localStorage.getItem(`created_verification_${user.uid}`) === "true";

        if (user.emailVerified && !claimedSignupCredits && !isDismissed && !hasCreatedBefore) {
          const hasVerificationNotif = notifs.some((n) => n.type === "verification");
          if (!hasVerificationNotif) {
            localStorage.setItem(`created_verification_${user.uid}`, "true");
            // Auto-create email verification reward notification in Firestore
            addDoc(notifRef, {
              title: "🎉 Email Verified! Claim 15 Free AI Credits",
              message: "Congratulations! Your email address has been verified. Claim your free 15 AI Credits now to start building resumes.",
              type: "verification",
              rewardAmount: 15,
              claimed: false,
              read: false,
              timestamp: serverTimestamp(),
            }).catch(console.error);
          }
        }

        setNotifications(notifs);
      },
      (error) => {
        console.error("[NotificationContext] Snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [user, claimedSignupCredits]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      const notifDoc = doc(db, "users", user.uid, "notifications", id);
      await updateDoc(notifDoc, { read: true });
    } catch (err) {
      console.error("[NotificationContext] Failed to mark as read:", err);
    }
  };

  const claimReward = async (notif: AppNotification): Promise<boolean> => {
    if (!user) return false;
    try {
      if (notif.type === "verification") {
        const success = await claimSignupCredits();
        if (success) {
          const notifDoc = doc(db, "users", user.uid, "notifications", notif.id);
          await updateDoc(notifDoc, { claimed: true, read: true });
          return true;
        }
      } else if (notif.rewardAmount && notif.rewardAmount > 0) {
        // Generic reward claiming logic: fetch current credits and ADD rewardAmount to existing balance
        const notifDoc = doc(db, "users", user.uid, "notifications", notif.id);
        const userRef = doc(db, "users", user.uid);
        
        const userSnap = await getDoc(userRef);
        const currentCredits = userSnap.exists() ? (userSnap.data().credits || 0) : 0;
        const newCredits = currentCredits + notif.rewardAmount;

        await updateDoc(userRef, { credits: newCredits });
        await updateDoc(notifDoc, { claimed: true, read: true });
        await refreshCredits();
        return true;
      }
      return false;
    } catch (err) {
      console.error("[NotificationContext] Failed to claim reward:", err);
      return false;
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      const targetNotif = notifications.find((n) => n.id === id);
      if (targetNotif?.type === "verification") {
        localStorage.setItem(`dismissed_verification_${user.uid}`, "true");
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const notifDoc = doc(db, "users", user.uid, "notifications", id);
      await deleteDoc(notifDoc);
    } catch (err) {
      console.error("[NotificationContext] Failed to delete notification:", err);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const hasVerification = notifications.some((n) => n.type === "verification");
      if (hasVerification) {
        localStorage.setItem(`dismissed_verification_${user.uid}`, "true");
      }
      const idsToDelete = notifications.map((n) => n.id);
      setNotifications([]);
      const deletePromises = idsToDelete.map((id) =>
        deleteDoc(doc(db, "users", user.uid, "notifications", id))
      );
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("[NotificationContext] Failed to clear all notifications:", err);
    }
  };

  const sendNotification = async (
    targetUid: string,
    notif: Omit<AppNotification, "id" | "read" | "timestamp">
  ) => {
    try {
      const notifRef = collection(db, "users", targetUid, "notifications");
      const cleanData: Record<string, any> = {
        title: notif.title || "",
        message: notif.message || "",
        type: notif.type || "system",
        read: false,
        claimed: false,
        timestamp: serverTimestamp(),
      };
      if (typeof notif.rewardAmount === "number" && notif.rewardAmount > 0) {
        cleanData.rewardAmount = notif.rewardAmount;
      }
      await addDoc(notifRef, cleanData);
    } catch (err) {
      console.error("[NotificationContext] Failed to send notification:", err);
      throw err;
    }
  };

  const broadcastNotification = async (
    notif: Omit<AppNotification, "id" | "read" | "timestamp">
  ) => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const cleanData: Record<string, any> = {
        title: notif.title || "",
        message: notif.message || "",
        type: notif.type || "system",
        read: false,
        claimed: false,
        timestamp: serverTimestamp(),
      };
      if (typeof notif.rewardAmount === "number" && notif.rewardAmount > 0) {
        cleanData.rewardAmount = notif.rewardAmount;
      }

      const promises = usersSnap.docs.map((docSnap) => {
        const targetUid = docSnap.id;
        const notifRef = collection(db, "users", targetUid, "notifications");
        return addDoc(notifRef, cleanData);
      });
      await Promise.all(promises);
    } catch (err) {
      console.error("[NotificationContext] Broadcast failed:", err);
      throw err;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        claimReward,
        deleteNotification,
        clearAllNotifications,
        sendNotification,
        broadcastNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
