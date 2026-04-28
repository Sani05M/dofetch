"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCertificates } from "@/hooks/useCertificates";
import { CertificateCard, Certificate } from "@/components/CertificateCard";
import { CertificatePreview } from "@/components/CertificatePreview";
import { AnimatedSection, containerVariants, itemVariants } from "@/components/AnimatedSection";
import { LayoutGrid, CheckCircle2, Clock, Plus, Zap, ArrowUpRight, RefreshCcw, Activity, Flame, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";



import { useAuth } from "@/context/AuthContext";

export default function StudentDashboard() {
  const { certificates, refresh } = useCertificates();
  const { user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quota, setQuota] = useState({ used: 0, limit: 10 });
  const [loadingQuota, setLoadingQuota] = useState(true);

  const fetchQuota = async () => {
    try {
      const res = await fetch("/api/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota({ used: data.used, limit: data.limit });
      }
    } catch (err) {
      console.error("Failed to fetch quota");
    } finally {
      setLoadingQuota(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refresh(), fetchQuota(), refreshProfile()]);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  React.useEffect(() => {
    fetchQuota();
    const interval = setInterval(handleRefresh, 5000);
    return () => clearInterval(interval);
  }, []);

  const verifiedCount = certificates.filter(c => c.status === "verified" || c.status === "approved").length;
  const pendingCount = certificates.filter(c => c.status === "pending").length;
  
  // Modal state
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (cert: Certificate) => {
    setSelectedCert(cert);
    setIsPreviewOpen(true);
  };

  const stats = [
    { label: "Total Artifacts", count: certificates.length, icon: <LayoutGrid />, color: "bg-bg-surface border-border shadow-[4px_4px_0_#000]" },
    { label: "Verified Syncs", count: verifiedCount, icon: <CheckCircle2 />, color: "bg-accent border-bg-dark shadow-[4px_4px_0_#000] text-[#000]" },
    { label: "Pending Nodes", count: pendingCount, icon: <Clock />, color: "bg-bg-dark text-text-on-dark border-text-primary shadow-[4px_4px_0_#000]" },
  ];

  return (
    <DashboardLayout allowedRole="student">
      {/* Hero Header */}
      <AnimatedSection>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6 md:gap-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-bg-surface rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 border border-border shadow-[4px_4px_0_#000]">
              <Zap className="w-3 h-3 text-accent fill-current" />
              <span>Institutional Mesh Active</span>
            </div>
            <h1 className="text-3xl xs:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight text-text-primary">
              WELCOME BACK,<br/>
              <span className="text-accent">{user?.name || "STUDENT"}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ x: 3, y: 3 }}
              className="hidden md:block"
            >
              <Link 
                href={profile?.portfolio_slug ? `/portfolio/${profile.portfolio_slug}` : '/student/profile'} 
                className={cn(
                  "flex items-center gap-2 px-6 py-3 md:py-4 bg-zinc-900 border-3 border-bg-dark rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs text-white hover:shadow-[4px_4px_0_#000] transition-all",
                  !profile?.portfolio_slug && "opacity-80"
                )}
              >
                <UserIcon className="w-4 h-4 text-accent" />
                {profile?.portfolio_slug ? "Live Portfolio" : "Setup Slug"}
              </Link>
            </motion.div>
            <button
              onClick={handleRefresh}
              title="Live Sync (every 5s)"
              className="w-11 h-11 bg-bg-surface border-3 border-bg-dark rounded-2xl flex items-center justify-center text-text-primary hover:bg-accent hover:shadow-[4px_4px_0_#000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
              >
                <RefreshCcw className="w-5 h-5" />
              </motion.div>
            </button>
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ x: 3, y: 3 }}
              className="w-full md:w-auto"
            >
              <Link href="/student/upload" className="w-full btn-primary px-8 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all active:shadow-none shadow-[4px_4px_0_#000]">
                <Plus className="w-5 h-5 stroke-[3px]" />
                Sync Credential
              </Link>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* Grid Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-20"
      >
        {/* Daily Quota Card */}
        <motion.div variants={itemVariants} whileHover={{ x: -1, y: -1 }} whileTap={{ x: 3, y: 3 }}>
          <div className={cn(
            "bento-3d flex flex-col justify-between h-40 md:h-48 transition-all active:shadow-none p-6 md:p-8 rounded-2xl md:rounded-3xl bg-bg-surface border-border shadow-[4px_4px_0_#000]"
          )}>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 shadow-sm border-2 border-orange-500/20">
                <Flame className="w-5 h-5 md:w-6 md:h-6 fill-current" />
              </div>
              <Activity className="w-5 h-5 md:w-6 md:h-6 opacity-30" />
            </div>
            <div>
              <span className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                {(profile?.streak_data as any)?.current || 0}
              </span>
              <p className="text-[10px] md:text-sm font-black uppercase tracking-widest mt-1 md:mt-2 opacity-80">Day Streak</p>
            </div>
          </div>
        </motion.div>

        {/* Quota Stats Card */}
        <motion.div variants={itemVariants} whileHover={{ x: -1, y: -1 }} whileTap={{ x: 3, y: 3 }}>
          <Link href="/student/upload" className={cn(
            "bento-3d flex flex-col justify-between h-40 md:h-48 transition-all active:shadow-none p-6 md:p-8 rounded-2xl md:rounded-3xl",
            loadingQuota || quota.used < quota.limit ? "bg-bg-surface border-border shadow-[4px_4px_0_#000]" : "bg-red-500 border-bg-dark shadow-[4px_4px_0_#000] text-white"
          )}>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-bg-surface rounded-xl flex items-center justify-center text-text-primary shadow-sm border-2 border-border">
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 opacity-30 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <span className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
                {loadingQuota ? "-" : quota.used}
              </span>
              <span className="text-xl md:text-2xl font-black opacity-30">/{loadingQuota ? "-" : quota.limit}</span>
              <p className="text-[10px] md:text-sm font-black uppercase tracking-widest mt-1 md:mt-2 opacity-80">Daily Quota</p>
            </div>
          </Link>
        </motion.div>

        {stats.map((stat, i) => {
          const href = stat.label === "Total Artifacts" 
            ? "/student/certificates" 
            : stat.label === "Verified Syncs" 
              ? "/student/certificates?filter=verified" 
              : "/student/certificates?filter=pending";
              
          return (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ x: -1, y: -1 }}
              whileTap={{ x: 3, y: 3 }}
            >
              <Link href={href} className={cn(
                "bento-3d flex flex-col justify-between h-40 md:h-48 transition-all active:shadow-none p-6 md:p-8 rounded-2xl md:rounded-3xl",
                stat.color
              )}>
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-bg-surface rounded-xl flex items-center justify-center text-text-primary shadow-sm border-2 border-border">
                    {React.cloneElement(stat.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 md:w-6 md:h-6" })}
                  </div>
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <span className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{stat.count}</span>
                  <p className="text-[10px] md:text-sm font-black uppercase tracking-widest mt-1 md:mt-2 opacity-80">{stat.label}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Badges Showcase */}
      {profile?.badges && profile.badges.length > 0 && (
        <AnimatedSection delay={0.2}>
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-text-primary">EARNED BADGES</h2>
              <div className="h-[2px] flex-1 bg-border/30" />
            </div>
            <div className="flex flex-wrap gap-4">
              {profile.badges.map((badge: string, idx: number) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="px-6 py-4 bg-bg-surface border-3 border-bg-dark rounded-2xl flex items-center gap-4 shadow-[4px_4px_0_#000]"
                >
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border-2 border-accent/20">
                    <Zap className="w-5 h-5 text-accent fill-current" />
                  </div>
                  <span className="font-black uppercase tracking-tighter text-sm">{badge.replace('_', ' ')}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* Recent Activity */}
      <AnimatedSection delay={0.4}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-text-primary">RECENTLY SYNCED</h2>
          <Link href="/student/certificates" className="w-fit text-[10px] md:text-sm font-black uppercase tracking-widest border-b-3 md:border-b-4 border-accent pb-1 hover:text-accent transition-colors">
            View Full Vault
          </Link>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {certificates.slice(0, 6).map((cert) => (
            <motion.div key={cert.id} variants={itemVariants}>
              <CertificateCard 
                certificate={cert} 
                onClick={() => handlePreview(cert)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      <CertificatePreview 
        certificate={selectedCert}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDelete={refresh}
      />
    </DashboardLayout>
  );
}
