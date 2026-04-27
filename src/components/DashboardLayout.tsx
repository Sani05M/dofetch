"use client";

import React, { useEffect } from "react";
import { useAuth, Role } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, LogOut, LayoutGrid, Plus, ShieldCheck, UserCircle, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserButton, useUser } from "@clerk/nextjs";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRole: Role;
}

export function DashboardLayout({ children, allowedRole }: DashboardLayoutProps) {
  const { user, logout, isLoading } = useAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    } else if (!isLoading && user && clerkLoaded && clerkUser) {
      if (!clerkUser.publicMetadata.onboardingComplete) {
        router.push("/onboarding");
      } else if (user.role !== allowedRole) {
        router.push(user.role === "student" ? "/student/dashboard" : "/faculty/dashboard");
      }
    }
  }, [user, isLoading, clerkUser, clerkLoaded, allowedRole, router]);

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
    <div className={`min-h-screen bg-bg-base text-text-primary font-sans selection:bg-accent selection:text-bg-dark ${user.role === "faculty" ? "theme-faculty" : ""}`}>
      {/* Same Navbar as Landing Page but for Dashboards */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href={user.role === "student" ? "/student/dashboard" : "/faculty/dashboard"} className="flex items-center gap-2 group shrink-0">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-accent rounded md:rounded-lg flex items-center justify-center transform rotate-45 group-hover:bg-bg-dark transition-colors">
              <Zap className="w-3.5 h-3.5 md:w-4 md:h-4 text-bg-dark -rotate-45 fill-current group-hover:text-accent" />
            </div>
            <span className="font-black text-base md:text-xl tracking-tighter uppercase">ADAMAS</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-[10px] md:text-xs font-black uppercase tracking-widest">
            {user.role === "student" ? (
              <>
                <Link href="/student/dashboard" className="hover:text-accent transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-accent pb-1"><LayoutGrid className="w-3.5 h-3.5"/> Dashboard</Link>
                <Link href="/student/certificates" className="hover:text-accent transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-accent pb-1"><ShieldCheck className="w-3.5 h-3.5"/> My Vault</Link>
                <Link href="/student/upload" className="hover:text-accent transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-accent pb-1"><Plus className="w-3.5 h-3.5"/> Sync Artifact</Link>
              </>
            ) : (
              <>
                <Link href="/faculty/dashboard" className="hover:text-accent transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-accent pb-1"><LayoutGrid className="w-3.5 h-3.5"/> Command Center</Link>
                <Link href="/faculty/certificates" className="hover:text-accent transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-accent pb-1"><ShieldCheck className="w-3.5 h-3.5"/> Audit Queue</Link>
                <Link href="/faculty/sections" className="hover:text-accent transition-colors flex items-center gap-2 border-b-2 border-transparent hover:border-accent pb-1"><Layers className="w-3.5 h-3.5"/> Sections</Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 bg-bg-surface rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] border-2 border-border shadow-[2px_2px_0_var(--color-border)]">
              <span className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-text-secondary truncate max-w-[80px] md:max-w-none">{user.role === "faculty" ? "Authority" : "Student Node"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-3">
              <div className="p-1 rounded-xl bg-bg-surface border-2 border-border flex items-center justify-center text-text-secondary hover:border-text-primary hover:shadow-[3px_3px_0_var(--color-text-primary)] transition-all">
                <UserButton 
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "w-7 h-7 md:w-8 md:h-8 rounded-lg",
                    }
                  }}
                />
              </div>
              <motion.button 
                whileTap={{ x: 2, y: 2 }}
                onClick={handleLogout} 
                className="bg-[#ef4444] text-white px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2 border-2 border-bg-dark shadow-[3px_3px_0_#000] active:shadow-none"
              >
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface/90 backdrop-blur-md border-t-3 border-border flex md:hidden items-center justify-around h-16 px-4 pb-safe">
        {user.role === "student" ? (
          <>
            <Link href="/student/dashboard" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              <LayoutGrid className="w-5 h-5"/>
              <span>Home</span>
            </Link>
            <Link href="/student/certificates" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              <ShieldCheck className="w-5 h-5"/>
              <span>Vault</span>
            </Link>
            <Link href="/student/upload" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              <motion.div 
                whileTap={{ x: 4, y: 4 }}
                className="w-10 h-10 -mt-8 bg-accent border-3 border-bg-dark rounded-xl flex items-center justify-center text-bg-dark shadow-[4px_4px_0_#000] active:shadow-none transition-all"
              >
                <Plus className="w-6 h-6 stroke-[3px]"/>
              </motion.div>
              <span>Sync</span>
            </Link>
            <Link href="/student/profile" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              <UserCircle className="w-5 h-5"/>
              <span>Profile</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/faculty/dashboard" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              <LayoutGrid className="w-5 h-5"/>
              <span>Home</span>
            </Link>
            <Link href="/faculty/sections" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              <Layers className="w-5 h-5"/>
              <span>Clusters</span>
            </Link>
            <Link href="/faculty/certificates" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
              <motion.div 
                whileTap={{ x: 4, y: 4 }}
                className="w-10 h-10 -mt-8 bg-accent border-3 border-bg-dark rounded-xl flex items-center justify-center text-bg-dark shadow-[4px_4px_0_#000] active:shadow-none transition-all"
              >
                <ShieldCheck className="w-6 h-6 stroke-[3px]"/>
              </motion.div>
              <span>Audit</span>
            </Link>
            <Link href="/faculty/profile" className="flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest text-text-secondary hover:text-accent transition-colors">
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
