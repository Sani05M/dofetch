"use client";

import React, { useEffect } from "react";
import { useAuth, Role } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();

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

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { href: "/student/certificates", label: "My Vault", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { href: "/student/upload", label: "Sync Artifact", icon: <Plus className="w-3.5 h-3.5" /> },
  ];

  const facultyLinks = [
    { href: "/faculty/dashboard", label: "Command Center", icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { href: "/faculty/certificates", label: "Audit Queue", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { href: "/faculty/sections", label: "Sections", icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  const navLinks = user.role === "student" ? studentLinks : facultyLinks;

  return (
    <div className={`min-h-screen bg-bg-base text-text-primary font-sans selection:bg-accent selection:text-bg-dark ${user.role === "faculty" ? "theme-faculty" : ""}`}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-4">
          <Link href={user.role === "student" ? "/student/dashboard" : "/faculty/dashboard"} className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center transform rotate-45 group-hover:bg-bg-dark transition-colors">
              <Zap className="w-3.5 h-3.5 text-bg-dark -rotate-45 fill-current group-hover:text-accent" />
            </div>
            <span className="font-black text-base md:text-lg tracking-tighter uppercase">ADAMAS</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 text-[10px] font-black uppercase tracking-widest">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-150 ${
                    isActive
                      ? "bg-accent text-bg-dark shadow-[2px_2px_0_#000]"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-base"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 bg-bg-surface rounded-full text-[8px] font-black uppercase tracking-[0.2em] border-2 border-border shadow-[2px_2px_0_var(--color-border)]">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-text-secondary truncate max-w-[70px] md:max-w-none">{user.role === "faculty" ? "Authority" : "Student"}</span>
            </div>
            
            <div className="p-1 rounded-xl bg-bg-surface border-2 border-border flex items-center justify-center hover:border-text-primary hover:shadow-[3px_3px_0_var(--color-text-primary)] transition-all">
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-7 h-7 rounded-lg",
                  }
                }}
              />
            </div>
            <motion.button 
              whileTap={{ x: 2, y: 2 }}
              onClick={handleLogout} 
              className="bg-[#ef4444] text-white px-3 py-2 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-1.5 border-2 border-bg-dark shadow-[3px_3px_0_#000] active:shadow-none"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-surface/95 backdrop-blur-md border-t-2 border-border flex lg:hidden items-center justify-around h-16 px-2 pb-safe">
        {user.role === "student" ? (
          <>
            <NavTab href="/student/dashboard" label="Home" icon={<LayoutGrid className="w-5 h-5"/>} isActive={pathname === "/student/dashboard"} />
            
            <Link href="/student/upload" className={`flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-colors px-3 py-1 rounded-xl ${pathname === "/student/upload" ? "text-accent" : "text-text-secondary hover:text-text-primary"}`}>
              <Plus className={`w-5 h-5 ${pathname !== "/student/upload" && "text-accent"}`} />
              <span>Sync</span>
            </Link>

            <NavTab href="/student/certificates" label="Vault" icon={<ShieldCheck className="w-5 h-5"/>} isActive={pathname === "/student/certificates"} />
          </>
        ) : (
          <>
            <NavTab href="/faculty/dashboard" label="Home" icon={<LayoutGrid className="w-5 h-5"/>} isActive={pathname === "/faculty/dashboard"} />
            
            <Link href="/faculty/certificates" className={`flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-colors px-3 py-1 rounded-xl ${pathname === "/faculty/certificates" ? "text-accent" : "text-text-secondary hover:text-text-primary"}`}>
              <ShieldCheck className={`w-5 h-5 ${pathname !== "/faculty/certificates" && "text-accent"}`} />
              <span>Audit</span>
            </Link>

            <NavTab href="/faculty/sections" label="Clusters" icon={<Layers className="w-5 h-5"/>} isActive={pathname === "/faculty/sections"} />
          </>
        )}
      </nav>
      
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-24 lg:pb-8 page-transition">
        {children}
      </main>
    </div>
  );
}

function NavTab({ href, label, icon, isActive }: { href: string; label: string; icon: React.ReactNode; isActive: boolean }) {
  return (
    <Link
      href={href}
      prefetch={true}
      className={`flex flex-col items-center gap-1 text-[8px] font-black uppercase tracking-widest transition-colors px-3 py-1 rounded-xl ${
        isActive ? "text-accent" : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
