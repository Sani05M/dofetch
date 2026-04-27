"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCertificates } from "@/hooks/useCertificates";
import { CertificateCard, Certificate } from "@/components/CertificateCard";
import { CertificatePreview } from "@/components/CertificatePreview";
import { AnimatedSection, containerVariants, itemVariants } from "@/components/AnimatedSection";
import { Grid, List as ListIcon, Search, Filter, ShieldCheck, Zap, Download, MoreVertical } from "lucide-react";

function StudentVaultContent() {
  const { certificates, refresh } = useCertificates();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const [view, setView] = useState<"grid" | "list">("grid");
  
  // Modal state
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (cert: Certificate) => {
    setSelectedCert(cert);
    setIsPreviewOpen(true);
  };

  const filteredCertificates = useMemo(() => {
    if (!filterParam) return certificates;
    return certificates.filter((cert) => {
      const isVerified = cert.status === "verified" || cert.status === "approved";
      if (filterParam === "verified") return isVerified;
      if (filterParam === "pending") return cert.status === "pending" || cert.status === "rejected";
      return true;
    });
  }, [certificates, filterParam]);

  return (
    <>
      <AnimatedSection>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6">
              CREDENTIAL<br/>
              <span className="text-accent">VAULT</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search artifacts..." 
                  className="input-field pl-12 w-full md:w-96"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              </div>
              <button className="h-[60px] px-6 bg-bg-surface border-4 border-border rounded-xl hover:border-text-primary transition-colors flex items-center justify-center">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-bg-surface border-4 border-border p-1.5 rounded-xl">
            <button 
              onClick={() => setView("grid")}
              className={`p-3 rounded-lg transition-all ${view === "grid" ? "bg-bg-dark text-text-on-dark" : "text-text-secondary hover:bg-bg-base"}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView("list")}
              className={`p-3 rounded-lg transition-all ${view === "list" ? "bg-bg-dark text-text-on-dark" : "text-text-secondary hover:bg-bg-base"}`}
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </AnimatedSection>

      {view === "grid" ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {filteredCertificates.map((cert) => (
            <motion.div key={cert.id} variants={itemVariants}>
              <CertificateCard 
                certificate={cert} 
                onClick={() => handlePreview(cert)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <AnimatedSection delay={0.2}>
          <div className="bento-card p-0 overflow-hidden bg-bg-surface border-2 md:border-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px] md:min-w-0">
                <thead>
                  <tr className="border-b-4 border-border bg-bg-base">
                    <th className="px-4 md:px-6 py-4 text-[10px] md:text-sm font-black uppercase tracking-widest text-text-secondary">Title</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] md:text-sm font-black uppercase tracking-widest text-text-secondary">Status</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] md:text-sm font-black uppercase tracking-widest text-text-secondary">Date</th>
                    <th className="px-4 md:px-6 py-4 text-[10px] md:text-sm font-black uppercase tracking-widest text-text-secondary text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-border">
                  {filteredCertificates.map((cert) => {
                    const isVerified = cert.status === "verified" || cert.status === "approved";
                    return (
                      <tr 
                        key={cert.id} 
                        onClick={() => handlePreview(cert)}
                        className="group hover:bg-accent hover:border-text-primary transition-colors cursor-pointer"
                      >
                        <td className="px-4 md:px-6 py-4 md:py-5">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-bg-dark flex items-center justify-center text-accent group-hover:bg-bg-surface border-2 border-bg-dark shrink-0">
                              <Zap className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                            </div>
                            <span className="font-black text-sm md:text-lg text-text-primary group-hover:text-[#09090b] uppercase tracking-tight truncate max-w-[150px] md:max-w-none">{cert.title}</span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-5">
                          <div className={`inline-flex items-center px-2 md:px-3 py-1 md:py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest ${isVerified ? "bg-green-100 text-green-700 border-green-700" : "bg-yellow-100 text-yellow-700 border-yellow-500"}`}>
                            {isVerified ? "VERIFIED" : "PENDING"}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-sm font-bold uppercase tracking-widest text-text-secondary group-hover:text-[#09090b]">{cert.issueDate}</td>
                        <td className="px-4 md:px-6 py-4 md:py-5 text-right">
                          <div className="flex items-center justify-end gap-1 md:gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 md:p-2 hover:bg-bg-surface rounded-lg transition-colors text-text-primary group-hover:text-[#09090b] border-2 border-transparent hover:border-text-primary"
                            >
                              <Download className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 md:p-2 hover:bg-bg-surface rounded-lg transition-colors text-text-primary group-hover:text-[#09090b] border-2 border-transparent hover:border-text-primary"
                            >
                              <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </AnimatedSection>
      )}

      <CertificatePreview 
        certificate={selectedCert}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onDelete={refresh}
      />
    </>
  );
}

export default function StudentVault() {
  return (
    <DashboardLayout allowedRole="student">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-2xl font-black uppercase tracking-widest text-zinc-400 animate-pulse">
            LOADING VAULT...
          </div>
        </div>
      }>
        <StudentVaultContent />
      </Suspense>
    </DashboardLayout>
  );
}
