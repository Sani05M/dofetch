"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCertificates } from "@/hooks/useCertificates";
import { CertificateCard, Certificate } from "@/components/CertificateCard";
import { CertificatePreview } from "@/components/CertificatePreview";
import { AnimatedSection, containerVariants, itemVariants } from "@/components/AnimatedSection";
import { LayoutGrid, CheckCircle2, Clock, Plus, Zap, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/context/AuthContext";

export default function StudentDashboard() {
  const { certificates, refresh } = useCertificates();
  const { user } = useAuth();

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
            <h1 className="text-3xl xs:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-text-primary">
              WELCOME BACK,<br/>
              <span className="text-accent">{user?.name || "STUDENT"}</span>
            </h1>
          </div>
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
      </AnimatedSection>

      {/* Grid Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16 md:mb-20"
      >
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
