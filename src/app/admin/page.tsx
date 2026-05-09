"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  Search,
  Bell,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  MoreVertical,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  LogOut,
  Mail,
  UserPlus,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  UserCog
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/nextjs";

// --- Mock Data (Extended for Management) ---

const STATS = [
  { label: "Total Users", value: "24,512", trend: "+12%", trendType: "up", icon: Users },
  { label: "Total Revenue", value: "$45,210", trend: "+8.5%", trendType: "up", icon: Zap },
  { label: "Active Nodes", value: "1,240", trend: "-2.4%", trendType: "down", icon: Activity },
  { label: "System Uptime", value: "99.98%", trend: "Stable", trendType: "neutral", icon: ShieldCheck },
];

const ANALYTICS_DATA = [
  { name: "Mon", users: 4000, revenue: 2400 },
  { name: "Tue", users: 3000, revenue: 1398 },
  { name: "Wed", users: 2000, revenue: 9800 },
  { name: "Thu", users: 2780, revenue: 3908 },
  { name: "Fri", users: 1890, revenue: 4800 },
  { name: "Sat", users: 2390, revenue: 3800 },
  { name: "Sun", users: 3490, revenue: 4300 },
];

const USERS_DATA = [
  { id: 1, name: "Alex Rivera", email: "alex@example.com", status: "Active", role: "Super Admin", lastActive: "2m ago" },
  { id: 2, name: "Sarah Chen", email: "sarah@example.com", status: "Active", role: "Admin", lastActive: "15m ago" },
  { id: 3, name: "Marcus Thorne", email: "marcus@example.com", status: "Inactive", role: "Editor", lastActive: "2d ago" },
  { id: 4, name: "Elena Gilbert", email: "elena@example.com", status: "Active", role: "Moderator", lastActive: "5h ago" },
  { id: 5, name: "David Miller", email: "david@example.com", status: "Pending", role: "User", lastActive: "N/A" },
];

// --- Sub-components ---

const StatCard = ({ label, value, trend, trendType, icon: Icon }: any) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="bento-card relative overflow-hidden group border-white/[0.05] bg-white/[0.02]"
  >
    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-12 h-12" />
    </div>
    <div className="flex flex-col gap-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent/10 text-accent border border-accent/20">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-text-secondary">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <h3 className="text-3xl font-black italic text-text-primary">{value}</h3>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full border",
          trendType === "up" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
            trendType === "down" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
              "bg-bg-surface text-text-primary border-border"
        )}>
          {trendType === "up" && <TrendingUp className="w-3 h-3" />}
          {trendType === "down" && <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
    </div>
  </motion.div>
);

const SectionHeader = ({ title, description, action }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h2 className="text-2xl font-black italic text-text-primary tracking-tight">{title}</h2>
      <p className="text-sm text-text-secondary mt-1">{description}</p>
    </div>
    {action && action}
  </div>
);

// --- Auth States UI ---

const AuthLayout = ({ children, title, subtitle }: any) => (
  <div className="min-h-screen bg-bg-base flex items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[150px] rounded-full" />
    <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[150px] rounded-full" />

    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md glass-island p-10 rounded-[3rem] border border-white/[0.05] relative z-10 text-center"
    >
      <div className="w-16 h-16 bg-accent rounded-2xl mx-auto flex items-center justify-center text-black mb-8 shadow-[0_0_30px_rgba(253,224,71,0.2)]">
        <Zap className="w-8 h-8 fill-current" />
      </div>
      <h1 className="text-3xl font-black italic text-text-primary mb-2">{title}</h1>
      <p className="text-sm text-text-secondary mb-8">{subtitle}</p>
      {children}
    </motion.div>
  </div>
);

// --- Main Page ---

export default function AdminDashboard() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();

  const [viewMode, setViewMode] = useState<"loading" | "unauthorized" | "request_pending" | "set_password" | "verify_password" | "dashboard">("loading");
  const [activeTab, setActiveTab] = useState("overview");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const [managementData, setManagementData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [directAddId, setDirectAddId] = useState("");
  const [directAddRole, setDirectAddRole] = useState("admin");
  const [directAddPerms, setDirectAddPerms] = useState(["overview"]);
  const [isSandboxMode, setIsSandboxMode] = useState(true);

  useEffect(() => {
    if (clerkLoaded) {
      checkStatus();
    }
  }, [clerkLoaded]);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/admin/status");
      const data = await res.json();
      setAdminStatus(data);

      if (data.status === "authorized") setViewMode("dashboard");
      else if (data.status === "needs_password") setViewMode("verify_password");
      else if (data.status === "set_password") setViewMode("set_password");
      else if (data.status === "request_pending") setViewMode("request_pending");
      else setViewMode("unauthorized");
    } catch (err) {
      setError("Failed to verify credentials");
      setViewMode("unauthorized");
    }
  };

  const handleRequestAccess = async () => {
    setError("");
    try {
      const res = await fetch("/api/admin/status", { method: "POST" });
      if (res.ok) {
        checkStatus(); // Re-check status to move to request_pending
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit request. Ensure database tables are created.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    }
  };

  const handleAuth = async (action: "set" | "verify") => {
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, action })
      });
      const data = await res.json();
      if (data.success) {
        checkStatus();
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Server error during authentication");
    }
  };

  const fetchManagement = async () => {
    const res = await fetch("/api/admin/manage");
    const data = await res.json();
    setManagementData(data);
  };

  useEffect(() => {
    if (activeTab === "management") fetchManagement();
  }, [activeTab]);

  const [actionError, setActionError] = useState("");

  const handleAction = async (targetUserId: string, action: string, permissions?: string[], role?: string) => {
    setIsUpdating(true);
    setActionError("");
    try {
      const res = await fetch("/api/admin/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, permissions, role })
      });
      const data = await res.json();
      
      if (res.ok) {
        await fetchManagement();
        if (action === "approve") setDirectAddId("");
      } else {
        setActionError(data.error || "Failed to perform action");
      }
    } catch (err) {
      console.error("Action failed:", err);
      setActionError("Network or Server error");
    } finally {
      setIsUpdating(false);
    }
  };

  const togglePermission = (admin: any, perm: string) => {
    const newPerms = admin.permissions.includes(perm)
      ? admin.permissions.filter((p: string) => p !== perm)
      : [...admin.permissions, perm];
    handleAction(admin.user_id, "update", newPerms, admin.role);
  };

  if (viewMode === "loading") {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white/5 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (viewMode === "unauthorized") {
    return (
      <AuthLayout title="ACCESS DENIED" subtitle="Administrative privileges required for the ADAMOS protocol.">
        <div className="space-y-6">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-[10px] font-black uppercase text-left">
            <ShieldAlert className="w-5 h-5" />
            <span>Unauthorized Identity Detected</span>
          </div>
          <div className="pt-4 border-t border-border">
            <p className="text-[8px] text-text-secondary uppercase font-black mb-1">Authenticated Email:</p>
            <p className="text-xs text-text-primary font-black truncate mb-6">{clerkUser?.primaryEmailAddress?.emailAddress}</p>
            <button onClick={() => signOut()} className="btn-primary w-full rounded-xl">
              EXIT SYSTEM
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  if (viewMode === "request_pending") {
    return (
      <AuthLayout title="PENDING APPROVAL" subtitle="Your request has been beamed to the Superuser. Please wait for authorization.">
        <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] space-y-4">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full mx-auto flex items-center justify-center text-amber-500">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">Synchronization in Progress</p>
        </div>
        <button onClick={() => signOut()} className="mt-8 text-[10px] text-text-secondary uppercase font-black hover:text-text-primary transition-colors">
          Switch Identity
        </button>
      </AuthLayout>
    );
  }

  if (viewMode === "set_password" || viewMode === "verify_password") {
    const isSet = viewMode === "set_password";
    return (
      <AuthLayout
        title={isSet ? "SET PROTOCOL PASS" : "IDENTITY VERIFICATION"}
        subtitle={isSet ? "Assign a security key for your administrative session." : "Enter your secret key to decrypt the dashboard."}
      >
        <div className="space-y-6">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="password"
              placeholder="ENTER SECURITY KEY..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          {error && <p className="text-[10px] text-rose-500 font-black uppercase">{error}</p>}
          <button
            onClick={() => handleAuth(isSet ? "set" : "verify")}
            className="btn-primary w-full py-5 rounded-2xl"
          >
            {isSet ? "INITIALIZE SECURITY" : "DECRYPT SYSTEM"}
          </button>
        </div>
      </AuthLayout>
    );
  }

  const NAV_ITEMS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "User Control", icon: Users },
    { id: "analytics", label: "Deep Metrics", icon: BarChart3 },
    { id: "content", label: "Content Lab", icon: Zap },
    { id: "logs", label: "System Logs", icon: FileText },
    { id: "settings", label: "Global Config", icon: Settings },
    ...(adminStatus?.role === "super_admin" ? [{ id: "management", label: "Superuser Manage", icon: UserCog }] : []),
  ].filter(item => adminStatus?.permissions?.includes(item.id) || item.id === "management" || item.id === "overview");

  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-accent selection:text-black">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 blur-[150px] rounded-full" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed left-8 top-8 bottom-8 w-72 hidden lg:flex flex-col gap-6 z-50">
          <div className="glass-island rounded-[2.5rem] flex flex-col h-full overflow-hidden border border-white/[0.05] p-2 bg-white/[0.01] backdrop-blur-xl">
            {/* Brand */}
            <div className="p-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(253,224,71,0.3)]">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <span className="block font-black italic text-xl text-text-primary leading-tight">ADAMOS</span>
                  <span className="block text-[8px] uppercase tracking-[0.3em] text-accent font-black">Admin Core 2.0</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="px-3 space-y-2 flex-1">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-[11px] font-black transition-all group relative overflow-hidden",
                      isActive
                        ? "text-text-primary bg-white/[0.08] shadow-inner border border-white/[0.1]"
                        : "text-text-secondary hover:text-text-primary hover:bg-white/[0.03]"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-glow"
                        className="absolute left-0 w-1.5 h-6 bg-accent rounded-full"
                      />
                    )}

                    <item.icon className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
                    )} />

                    <span className="uppercase tracking-[0.2em]">{item.label}</span>

                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(253,224,71,0.5)]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Profile Footer */}
            <div className="mt-auto p-4 border-t border-white/[0.05]">
              <div className="p-4 rounded-[1.8rem] bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-black font-black text-sm">
                    {clerkUser?.firstName?.charAt(0) || "A"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-bg-base rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-text-primary truncate">{clerkUser?.fullName}</p>
                  <span className="text-[8px] text-accent uppercase tracking-widest font-black">{adminStatus?.role || "Admin"}</span>
                </div>
                <button onClick={() => signOut()} className="p-2 hover:bg-white/10 text-text-secondary hover:text-rose-500 rounded-xl transition-all">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-80 p-8 lg:p-12 relative z-10">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 lg:hidden bg-accent rounded-xl flex items-center justify-center text-black">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter text-text-primary">
                  {NAV_ITEMS.find(n => n.id === activeTab)?.label}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] text-amber-500 uppercase tracking-[0.2em] font-black">
                    Sandbox Protocol Active / Disconnected from Production
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="SEARCH PROTOCOLS..."
                  className="bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-12 pr-6 py-3 text-[10px] font-black text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/20 w-64 transition-all"
                />
              </div>
              <button className="relative p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-text-secondary hover:text-accent transition-all group">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-bg-base" />
              </button>
            </div>
          </header>

          {/* Dynamic Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "circOut" }}
            >
              {activeTab === "overview" && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {STATS.map((stat, i) => (
                      <StatCard key={i} {...stat} />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 bento-card bg-white/[0.01] border-white/[0.05] p-8">
                      <SectionHeader title="Growth Analytics" description="Track user acquisition and revenue scaling over time." />
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={ANALYTICS_DATA}>
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525b" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#090911", border: "1px solid #ffffff10", borderRadius: "12px" }} />
                            <Area type="monotone" dataKey="users" stroke="var(--color-accent)" strokeWidth={4} fill="url(#colorUsers)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="bento-card bg-white/[0.01] border-white/[0.05]">
                      <SectionHeader title="System Pulse" description="Recent critical system activities." />
                      <div className="space-y-6">
                        {[
                          { event: "New Deployment", time: "14m ago", status: "success", desc: "v2.0.4 production patch" },
                          { event: "High Traffic Alert", time: "2h ago", status: "warning", desc: "Edge node node-04 at 85% capacity" },
                          { event: "Security Audit", time: "5h ago", status: "success", desc: "All protocols verified secure" },
                        ].map((item, i) => (
                          <div key={i} className="flex gap-4">
                            <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border", item.status === "success" ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20")}>
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-[11px] font-black text-text-primary uppercase">{item.event}</h4>
                              <p className="text-[10px] text-text-secondary">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "management" && (
                <div className="space-y-12">
                  {/* Direct Add Section */}
                  <div className="bento-card bg-white/[0.01] border-white/[0.05] p-10 rounded-[3rem]">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                      <div>
                        <h2 className="text-2xl font-black italic text-text-primary tracking-tight">Access Provisioning</h2>
                        <p className="text-sm text-text-secondary mt-1">Directly authorize users into the administrative protocol.</p>
                      </div>
                      <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Root Control Active</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 space-y-3">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Protocol ID (User ID)</label>
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary group-focus-within:text-accent transition-colors" />
                          <input 
                            type="text" 
                            placeholder="user_2pX..." 
                            value={directAddId}
                            onChange={(e) => setDirectAddId(e.target.value)}
                            className="input-field pl-12 h-14"
                          />
                        </div>
                      </div>
                      <div className="w-full md:w-56 space-y-3">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Assigned Role</label>
                        <div className="relative">
                          <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                          <select 
                            value={directAddRole}
                            onChange={(e) => setDirectAddRole(e.target.value)}
                            className="input-field pl-12 h-14 appearance-none cursor-pointer hover:border-white/20 transition-all"
                          >
                            <option value="admin">ADMINISTRATOR</option>
                            <option value="super_admin">SUPERUSER</option>
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAction(directAddId, "approve", directAddPerms, directAddRole)}
                        disabled={!directAddId || isUpdating}
                        className="btn-primary h-14 px-10 rounded-2xl font-black italic tracking-tight disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex items-center gap-3">
                          {isUpdating ? <Activity className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 group-hover:fill-current transition-all" />}
                          <span>{isUpdating ? "SYNCING..." : "AUTHORIZE"}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="bento-card bg-white/[0.01] border-white/[0.05] p-8 rounded-[2.5rem]">
                      <SectionHeader title="Superusers" description="Review and moderate pending authorization requests." />
                      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {managementData?.requests?.filter((r: any) => r.status === "pending").map((req: any) => (
                          <div key={req.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                            <div>
                              <p className="text-sm font-black text-text-primary">{req.email}</p>
                              <p className="text-[9px] text-text-secondary font-mono mt-1 opacity-50">{req.user_id}</p>
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => handleAction(req.user_id, "approve", ["overview", "users"])}
                                className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-2xl hover:bg-emerald-500 hover:text-black transition-all"
                                title="Approve Protocol Access"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleAction(req.user_id, "reject")}
                                className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/10 rounded-2xl hover:bg-rose-500 hover:text-text-primary transition-all"
                                title="Reject Request"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {(!managementData?.requests || managementData.requests.filter((r: any) => r.status === "pending").length === 0) && (
                          <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.05] rounded-3xl flex items-center justify-center mx-auto text-text-secondary opacity-20">
                              <Users className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em]">Registry Queue Empty</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bento-card bg-white/[0.01] border-white/[0.05] p-8 rounded-[2.5rem]">
                      <SectionHeader title="Superadmins" description="Manage access levels and module permissions for active administrators." />
                      <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {managementData?.admins?.map((admin: any) => (
                          <div key={admin.user_id} className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="flex items-start justify-between relative z-10">
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-text-primary font-black text-xs">
                                    {admin.user_id.slice(-2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-text-primary uppercase tracking-wider">{admin.user_id}</p>
                                    <button 
                                      onClick={() => handleAction(admin.user_id, "update", admin.permissions, admin.role === "admin" ? "super_admin" : "admin")}
                                      className={cn(
                                        "mt-1 px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all inline-flex items-center gap-1.5",
                                        admin.role === "super_admin" ? "bg-accent/10 text-accent border-accent/20" : "bg-white/5 text-text-secondary border-white/10 hover:border-white/20"
                                      )}
                                    >
                                      {admin.role === "super_admin" ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                                      {admin.role}
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <button className="p-3 text-rose-500/20 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                                <LogOut className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="space-y-3 relative z-10">
                              <p className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Module Privileges</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {["overview", "users", "analytics", "logs", "settings", "management"].map((perm) => (
                                  <button
                                    key={perm}
                                    onClick={() => togglePermission(admin, perm)}
                                    className={cn(
                                      "px-3 py-3 rounded-xl text-[9px] font-black uppercase border transition-all text-center",
                                      admin.permissions.includes(perm)
                                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                                        : "bg-transparent text-text-secondary border-white/5 hover:border-white/10"
                                    )}
                                  >
                                    {perm}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "content" && (
                <div className="space-y-10">
                  <div className="bento-card bg-white/[0.01] border-white/[0.05] p-10 rounded-[3rem]">
                    <SectionHeader 
                      title="Simulator: Content Engine" 
                      description="Stage and preview website changes in a disconnected sandbox environment." 
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-4">
                          <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">Global Messaging</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] text-text-secondary uppercase font-black mb-2 block">Hero Headline</label>
                              <input type="text" defaultValue="The Future of Digital Protocol" className="input-field" />
                            </div>
                            <div>
                              <label className="text-[10px] text-text-secondary uppercase font-black mb-2 block">Call to Action</label>
                              <input type="text" defaultValue="Initialize Access" className="input-field" />
                            </div>
                          </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.05] space-y-4">
                          <h3 className="text-xs font-black text-text-primary uppercase tracking-widest">Design Tokens</h3>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="h-12 bg-accent rounded-xl" title="Primary: Accent" />
                            <div className="h-12 bg-indigo-500 rounded-xl" title="Secondary: Indigo" />
                            <div className="h-12 bg-emerald-500 rounded-xl" title="Success: Emerald" />
                          </div>
                        </div>
                        <button className="btn-primary w-full py-5 rounded-2xl flex items-center justify-center gap-3">
                          <Activity className="w-5 h-5" />
                          <span>PUSH TO SANDBOX PREVIEW</span>
                        </button>
                      </div>
                      <div className="glass-island rounded-[2rem] border border-white/[0.1] bg-black/40 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          </div>
                          <span className="text-[8px] font-black text-text-secondary uppercase tracking-[0.3em]">sandbox-preview.adamos.local</span>
                        </div>
                        <div className="p-8 space-y-6">
                          <div className="w-20 h-2 bg-accent rounded-full" />
                          <div className="space-y-3">
                            <div className="w-full h-8 bg-white/10 rounded-lg" />
                            <div className="w-3/4 h-8 bg-white/10 rounded-lg" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-2xl" />
                            <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-2xl" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "users" && (
                <div className="bento-card bg-white/[0.01] border-white/[0.05] p-10 rounded-[3rem]">
                  <SectionHeader title="Registry: User Control" description="Manage Protocol participants within the sandbox registry." />
                  <div className="p-20 text-center space-y-6">
                    <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-[2rem] flex items-center justify-center mx-auto text-accent">
                      <Users className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-accent font-black uppercase tracking-[0.4em]">Sandbox Registry Active</p>
                      <p className="text-sm text-text-secondary max-w-xs mx-auto">Users in this registry are isolated from the production environment for security and testing.</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Stats Dock (Sticky) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="glass-island px-8 py-4 rounded-full border border-white/[0.1] bg-black/40 backdrop-blur-2xl flex items-center gap-8 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">CPU: 12%</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">RAM: 4.2GB</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-[10px] font-black text-text-primary uppercase tracking-widest">NET: 124MB/s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
