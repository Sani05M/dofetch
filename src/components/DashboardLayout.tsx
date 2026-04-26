"use client";

import React, { useEffect } from "react";
import { useAuth, Role } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, LogOut, LayoutGrid, Plus, ShieldCheck, UserCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRole: Role;
}

export function DashboardLayout({ children, allowedRole }: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    } else if (!isLoading && user && user.role !== allowedRole) {
      router.push(user.role === "student" ? "/student/dashboard" : "/faculty/dashboard");
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading || !user || user.role !== allowedRole) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-8 border-bg-surface border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-accent selection:text-bg-dark">
      {/* Same Navbar as Landing Page but for Dashboards */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href={user.role === "student" ? "/student/dashboard" : "/faculty/dashboard"} className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center transform rotate-45 group-hover:bg-bg-dark transition-colors">
              <Zap className="w-3.5 h-3.5 text-bg-dark -rotate-45 fill-current group-hover:text-accent" />
            </div>
            <span className="font-black text-lg md:text-xl tracking-tighter">ADAMAS</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold">
            {user.role === "student" ? (
              <>
                <Link href="/student/dashboard" className="hover:text-accent transition-colors flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> Dashboard</Link>
                <Link href="/student/certificates" className="hover:text-accent transition-colors flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> My Vault</Link>
                <Link href="/student/upload" className="hover:text-accent transition-colors flex items-center gap-2"><Plus className="w-4 h-4"/> Sync Artifact</Link>
              </>
            ) : (
              <>
                <Link href="/faculty/dashboard" className="hover:text-accent transition-colors flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> Command Center</Link>
                <Link href="/faculty/certificates" className="hover:text-accent transition-colors flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Audit Queue</Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-surface rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border border-border">
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-text-primary">{user.role === "faculty" ? "Authority Active" : "Student Node"}</span>
            </div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Link 
                href={user.role === "faculty" ? "/faculty/profile" : "/student/profile"}
                className="p-2 rounded-full hover:bg-bg-surface transition-colors border border-transparent hover:border-border block"
              >
                <UserCircle className="w-5 h-5 text-text-secondary hover:text-text-primary transition-colors" />
              </Link>
            </motion.div>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout} 
              className="bg-bg-dark text-text-on-dark px-3 md:px-5 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2 border border-border"
            >
              <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden xs:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface/80 backdrop-blur-md border-t border-border flex md:hidden items-center justify-around h-16 px-4">
        {user.role === "student" ? (
          <>
            <Link href="/student/dashboard" className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-text-secondary hover:text-accent">
              <LayoutGrid className="w-5 h-5"/>
              <span>Home</span>
            </Link>
            <Link href="/student/certificates" className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-text-secondary hover:text-accent">
              <ShieldCheck className="w-5 h-5"/>
              <span>Vault</span>
            </Link>
            <Link href="/student/upload" className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-text-secondary hover:text-accent">
              <Plus className="w-5 h-5"/>
              <span>Sync</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/faculty/dashboard" className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-text-secondary hover:text-accent">
              <LayoutGrid className="w-5 h-5"/>
              <span>Center</span>
            </Link>
            <Link href="/faculty/certificates" className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-text-secondary hover:text-accent">
              <ShieldCheck className="w-5 h-5"/>
              <span>Audit</span>
            </Link>
            <Link href="/faculty/profile" className="flex flex-col items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-text-secondary hover:text-accent">
              <UserCircle className="w-5 h-5"/>
              <span>Profile</span>
            </Link>
          </>
        )}
      </nav>
      
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-24 md:pb-20">
        {children}
      </main>
    </div>
  );
}
