import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ShieldCheck,
  Users,
  Bell,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  Sparkles,
  Search,
  Activity,
  LogOut,
  ArrowLeft,
  Loader2,
  Award,
  Database,
  RefreshCw,
  Gift,
  Copy,
  Check,
  Tag
} from "lucide-react";
import defaultLogoDark from "../assets/default.png";

interface UserDoc {
  uid: string;
  email: string;
  name?: string;
  credits: number;
  admin?: boolean;
  claimedSignupCredits?: boolean;
  createdAt?: any;
}

interface PromoCodeItem {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number;
  uses: number;
  active: boolean;
}

export function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading, logout } = useAuth();
  const { sendNotification, broadcastNotification } = useNotifications();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState<UserDoc[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "notifications" | "promos">("users");

  // Notification Dispatcher Form State
  const [targetType, setTargetType] = useState<"all" | "single">("all");
  const [selectedUserUid, setSelectedUserUid] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Credit Edit State
  const [editingCreditsUid, setEditingCreditsUid] = useState<string | null>(null);
  const [newCreditValue, setNewCreditValue] = useState<number>(0);

  // Promo Code Admin State
  const [newPromoCode, setNewPromoCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [promosList, setPromosList] = useState<PromoCodeItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Security Protection Guard
  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        navigate("/admin_login");
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const users: UserDoc[] = snap.docs.map((docSnap) => ({
        uid: docSnap.id,
        ...(docSnap.data() as Omit<UserDoc, "uid">),
      }));
      setUsersList(users);
    } catch (err) {
      console.error("[Admin] Failed to fetch users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const token = await user?.getIdToken().catch(() => "");
      const res = await fetch("/api/admin/promo/list", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.uid ? { "X-User-ID": user.uid } : {}),
        },
      });
      const data = await res.json();
      if (res.ok && data.promos) {
        setPromosList(data.promos);
      }
    } catch (e) {
      console.error("Failed to fetch promos", e);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchUsers();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    if (activeTab === "promos") {
      fetchPromoCodes();
    }
  }, [activeTab]);

  const handleDeletePromoCode = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete promo code '${code}'? It will be permanently removed from database.`)) return;
    try {
      const token = await user?.getIdToken().catch(() => "");
      const res = await fetch("/api/admin/promo/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.uid ? { "X-User-ID": user.uid } : {}),
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPromosList((prev) => prev.filter((p) => p.code !== code));
        alert(data.message || `Promo code '${code}' deleted!`);
      } else {
        alert(data.error || "Failed to delete promo code.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting promo code.");
    }
  };

  const handleToggleAdmin = async (targetUid: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, "users", targetUid);
      await updateDoc(userRef, { admin: !currentStatus });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, admin: !currentStatus } : u))
      );
    } catch (err) {
      console.error("[Admin] Failed to toggle admin status:", err);
    }
  };

  const handleUpdateCredits = async (targetUid: string) => {
    try {
      const userRef = doc(db, "users", targetUid);
      await updateDoc(userRef, { credits: newCreditValue });
      setUsersList((prev) =>
        prev.map((u) => (u.uid === targetUid ? { ...u, credits: newCreditValue } : u))
      );
      setEditingCreditsUid(null);
    } catch (err) {
      console.error("[Admin] Failed to update credits:", err);
    }
  };

  const handleDeleteUser = async (targetUid: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete account for ${email}?`)) return;
    try {
      await deleteDoc(doc(db, "users", targetUid));
      setUsersList((prev) => prev.filter((u) => u.uid !== targetUid));
    } catch (err) {
      console.error("[Admin] Failed to delete user:", err);
    }
  };

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingPromo(true);
    try {
      const token = await user?.getIdToken().catch(() => "");
      const res = await fetch("/api/admin/promo/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(user?.uid ? { "X-User-ID": user.uid } : {}),
        },
        body: JSON.stringify({
          code: newPromoCode,
          discount_type: discountType,
          discount_value: discountValue,
          max_uses: maxUses,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setNewPromoCode("");
        const newPromoItem = {
          code: data.code,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          max_uses: data.max_uses,
          uses: 0,
          active: true,
        };
        setPromosList((prev) => [newPromoItem, ...prev.filter((p) => p.code !== data.code)]);
        fetchPromoCodes();
      } else {
        alert(data.error || "Failed to create promo code.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreatingPromo(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    setDispatching(true);
    setDispatchSuccess(false);

    try {
      const notifData: any = {
        title: notifTitle,
        message: notifMessage,
        type: rewardAmount > 0 ? "reward" : "system",
      };
      if (rewardAmount > 0) {
        notifData.rewardAmount = rewardAmount;
      }

      if (targetType === "all") {
        await broadcastNotification(notifData);
      } else if (selectedUserUid) {
        await sendNotification(selectedUserUid, notifData);
      }

      setDispatchSuccess(true);
      setNotifTitle("");
      setNotifMessage("");
      setRewardAmount(0);
      setTimeout(() => setDispatchSuccess(false), 4000);
    } catch (err) {
      console.error("[Admin] Dispatch error:", err);
    } finally {
      setDispatching(false);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
        <p className="text-sm font-medium text-slate-400">Verifying Admin Access...</p>
      </div>
    );
  }

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalUsersCount = usersList.length;
  const adminUsersCount = usersList.filter((u) => u.admin).length;
  const totalDistributedCredits = usersList.reduce((acc, u) => acc + (u.credits || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-primary/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight">Admin Console</h1>
            <p className="text-[10px] text-slate-400">Production Governance & Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Exit to App
          </Link>
          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors flex items-center gap-1.5 border border-red-500/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Users</p>
              <h3 className="text-2xl font-black">{totalUsersCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Administrators</p>
              <h3 className="text-2xl font-black text-purple-400">{adminUsersCount}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Promos</p>
              <h3 className="text-2xl font-black text-amber-400">{promosList.length}</h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Gift className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "users"
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users className="w-4 h-4" /> User Management ({totalUsersCount})
          </button>

          <button
            onClick={() => setActiveTab("promos")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "promos"
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Gift className="w-4 h-4" /> Promo Code Generator ({promosList.length})
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === "notifications"
                ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Bell className="w-4 h-4" /> Push Notifications & Rewards
          </button>
        </div>

        {/* TAB 1: User Accounts Manager */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search user email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary"
                />
              </div>

              <button
                onClick={fetchUsers}
                disabled={loadingUsers}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 text-slate-300 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingUsers ? "animate-spin" : ""}`} /> Refresh List
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-4">User Email</th>
                      <th className="p-4">AI Credits</th>
                      <th className="p-4">Admin Status</th>
                      <th className="p-4">Signup Claimed</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                          Loading accounts...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-white">{u.email}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{u.uid}</div>
                          </td>
                          <td className="p-4 font-mono font-bold text-amber-400">
                            {editingCreditsUid === u.uid ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={newCreditValue}
                                  onChange={(e) => setNewCreditValue(Number(e.target.value))}
                                  className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-white text-xs"
                                />
                                <button
                                  onClick={() => handleUpdateCredits(u.uid)}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingCreditsUid(null)}
                                  className="px-2 py-1 bg-slate-800 text-slate-400 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{u.credits || 0}</span>
                                <button
                                  onClick={() => {
                                    setEditingCreditsUid(u.uid);
                                    setNewCreditValue(u.credits || 0);
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-white underline"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleAdmin(u.uid, !!u.admin)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                                u.admin
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                              }`}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {u.admin ? "admin=true" : "admin=false"}
                            </button>
                          </td>
                          <td className="p-4">
                            {u.claimedSignupCredits ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                              </span>
                            ) : (
                              <span className="text-slate-500">Unclaimed</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.uid, u.email)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROMO CODE GENERATOR & MANAGER (ADMIN CONSOLE) */}
        {activeTab === "promos" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Generator Form */}
              <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Generate Promo Code</h3>
                    <p className="text-xs text-slate-400">Create discount coupons for users.</p>
                  </div>
                </div>

                <form onSubmit={handleCreatePromoCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Promo Code String
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LAUNCH50 or SAVE20"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white uppercase tracking-wider focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Discount Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDiscountType("percent")}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          discountType === "percent"
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("fixed")}
                        className={`py-2 rounded-xl text-xs font-bold border ${
                          discountType === "fixed"
                            ? "bg-brand-primary text-white border-brand-primary"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        Fixed Amount (₹)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Discount Value ({discountType === "percent" ? "%" : "₹"})
                    </label>
                    <input
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Max Redemptions Limit
                    </label>
                    <input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingPromo}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {isCreatingPromo ? "Generating Code..." : "Create Promo Code"}
                  </button>
                </form>
              </div>

              {/* Active Coupons List Table */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-brand-primary" />
                    Active Promo Coupons ({promosList.length})
                  </h4>
                  <button
                    onClick={fetchPromoCodes}
                    className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {promosList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No promo codes generated yet. Use the generator on the left to create your first coupon.</p>
                ) : (
                  <div className="space-y-2">
                    {promosList.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs uppercase px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {p.code}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {p.discount_value}{p.discount_type === "percent" ? "% OFF" : " ₹ OFF"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-medium">
                            Redemptions: {p.uses || 0} / {p.max_uses}
                          </span>
                          <button
                            onClick={() => copyToClipboard(p.code)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold hover:text-white flex items-center gap-1 transition-all"
                          >
                            {copiedCode === p.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedCode === p.code ? "Copied" : "Copy"}
                          </button>

                          <button
                            onClick={() => handleDeletePromoCode(p.code)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                            title="Delete promo code"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: Push Notifications & Rewards Dispatcher */}
        {activeTab === "notifications" && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Push Notification & Reward Dispatcher</h3>
              <p className="text-xs text-slate-400">
                Send real-time in-app notifications and bonus AI credits to users.
              </p>
            </div>

            {dispatchSuccess && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Notification & Reward dispatched successfully!
              </div>
            )}

            <form onSubmit={handleDispatchNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Target Recipients
                </label>
                <div className="flex items-center gap-4 mb-3">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "all"}
                      onChange={() => setTargetType("all")}
                      className="accent-brand-primary"
                    />
                    All Registered Users ({totalUsersCount})
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === "single"}
                      onChange={() => setTargetType("single")}
                      className="accent-brand-primary"
                    />
                    Specific User Email
                  </label>
                </div>

                {targetType === "single" && (
                  <select
                    value={selectedUserUid}
                    onChange={(e) => setSelectedUserUid(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">-- Select Target User Email --</option>
                    {usersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.email} ({u.credits || 0} credits)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. 🎉 Special Bonus 100 AI Credits Received!"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Notification Message Body
                </label>
                <textarea
                  rows={3}
                  required
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Enter the detailed message for the user..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Bonus AI Credits Reward (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(Number(e.target.value))}
                    className="w-32 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-amber-400 font-bold focus:outline-none focus:border-brand-primary"
                  />
                  <span className="text-xs text-slate-400">
                    If &gt; 0, users will see a "Claim {rewardAmount} Credits" button in their bell notification.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={dispatching}
                className="w-full py-3 bg-gradient-to-r from-brand-primary to-purple-600 hover:from-brand-secondary hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-brand-primary/25 transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
              >
                {dispatching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Broadcast Push Notification
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
