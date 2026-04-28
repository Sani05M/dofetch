"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCertificates } from "@/hooks/useCertificates";
import { ShieldCheck, Users, FileCheck, AlertCircle, ArrowUpRight, Layers, Download, X, FileText, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "framer-motion";
import { CertificateSkeleton } from "@/components/SkeletonLoader";
import { AnimatedSection, containerVariants, itemVariants } from "@/components/AnimatedSection";
import { useAuth } from "@/context/AuthContext";
import { useGsapHeroReveal, useGsapCardStagger, useGsapModal } from "@/hooks/useGsapAnimations";

function StudentDetailModal({
  student,
  onClose,
}: {
  student: any;
  onClose: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const isOpen = !!student;
  const { backdropRef, panelRef } = useGsapModal(isOpen, () => setIsVisible(false));

  useEffect(() => {
    if (isOpen) setIsVisible(true);
  }, [isOpen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (!isVisible && !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-10 overflow-hidden"
      style={{ display: isVisible || isOpen ? "flex" : "none" }}
    >
      {/* GSAP Backdrop */}
      <div
        ref={backdropRef}
        style={{ opacity: 0 }}
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* GSAP Panel */}
      <div
        ref={panelRef}
        style={{ opacity: 0 }}
        className="relative w-full max-w-4xl bg-bg-surface border-4 border-border rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b-4 border-border bg-bg-base">
          <div className="flex items-start md:items-center gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] bg-accent border-4 border-bg-dark flex items-center justify-center text-3xl md:text-5xl font-black text-[#09090b] shadow-[4px_4px_0_var(--color-text-primary)] shrink-0">
              {student?.name?.charAt(0)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-text-primary truncate break-words">
                  {student?.name}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-bg-surface border-3 border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all shrink-0"
                >
                  <X className="w-5 h-5 md:w-7 md:h-7 stroke-[4px]" />
                </motion.button>
              </div>
              
              {/* Student Metadata Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-bg-surface border-2 border-border p-3 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Section</p>
                  <p className="text-sm font-black text-text-primary truncate">{student?.section}</p>
                </div>
                <div className="bg-bg-surface border-2 border-border p-3 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Roll No.</p>
                  <p className="text-sm font-black text-text-primary truncate">{student?.rollNumber}</p>
                </div>
                <div className="bg-bg-surface border-2 border-border p-3 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-1">Reg No.</p>
                  <p className="text-sm font-black text-text-primary truncate">{student?.regNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg-surface overflow-x-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="p-6 border-4 border-text-primary bg-accent shadow-[6px_6px_0_#000] text-[#09090b] rounded-3xl">
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Total Weightage</p>
              <p className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{student?.weightage}</p>
            </div>
            <div className="p-6 border-4 border-text-primary bg-bg-base shadow-[6px_6px_0_#000] rounded-3xl">
              <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-2">Verified Submissions</p>
              <p className="text-4xl md:text-6xl font-black tracking-tighter text-text-primary leading-none">{student?.certCount}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-sm md:text-lg font-black uppercase tracking-widest text-text-secondary whitespace-nowrap">Recent Ingestions</h3>
            <div className="h-[3px] flex-1 bg-border/30 rounded-full" />
          </div>
          
          <div className="space-y-4">
            {student?.certs?.map((cert: any) => (
              <div key={cert.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 border-3 border-border rounded-2xl hover:border-text-primary transition-all group gap-5 bg-bg-base/40">
                <div className="flex items-center gap-4 md:gap-6 min-w-0 flex-1">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-bg-base border-3 border-border flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:bg-accent/10 group-hover:border-accent transition-all shrink-0 shadow-[4px_4px_0_var(--color-border)]">
                    <FileText className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-text-primary uppercase tracking-tight text-lg md:text-2xl truncate group-hover:text-accent transition-colors leading-tight mb-1">
                      {cert.name}
                    </p>
                    <p className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-widest truncate">
                      {cert.issuer} • {cert.date}
                    </p>
                  </div>
                </div>
                <Link 
                  href={`/faculty/certificates/${cert.id}`}
                  className="w-full md:w-auto text-center px-10 py-4 bg-text-primary border-3 border-text-primary text-xs font-black uppercase tracking-widest text-bg-base rounded-xl hover:bg-accent hover:text-text-primary shadow-[6px_6px_0_#000] hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none shrink-0"
                >
                  View Audit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Faculty Dashboard ─────────────────────────────────────────────────────
export default function FacultyDashboard() {
  const { user } = useAuth();
  const { certificates, refresh, loading } = useCertificates();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // GSAP hooks
  const heroRef = useGsapHeroReveal();
  // Empty deps — animate once on mount only; data refreshes happen silently without re-triggering from opacity:0
  const statCardContainerRef = useGsapCardStagger([], { stagger: 0.08, delay: 0.1, y: 22 });
  const sectionCardContainerRef = useGsapCardStagger([], { stagger: 0.07, delay: 0.2, y: 18 });

  useEffect(() => setMounted(true), []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // useCertificates handles 5s silent polling internally

  const pendingCount = certificates.filter(c => c.status === "pending").length;
  const verifiedCount = certificates.filter(c => c.status === "verified" || c.status === "approved").length;
  const rejectedCount = certificates.filter(c => c.status === "rejected").length;
  const totalIssued = certificates.length;

  const PIE_DATA = [
    { name: "Verified", value: verifiedCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#facc15" },
    { name: "Rejected", value: rejectedCount, color: "#ef4444" },
  ];

  const studentMap = new Map();
  certificates.forEach(c => {
    if (!studentMap.has(c.studentId)) {
      studentMap.set(c.studentId, {
        id: c.studentId, // Keep full ID for mapping
        name: c.studentName || "Unknown Student",
        section: c.section || "N/A",
        rollNumber: (c as any).rollNumber || "N/A",
        regNumber: (c as any).regNumber || "N/A",
        certCount: 0,
        weightage: 0,
        certs: []
      });
    }
    const s = studentMap.get(c.studentId);
    s.certCount += 1;
    s.weightage += (c as any).score || 0;
    s.certs.push({ id: c.id, name: c.title, issuer: c.issuer, date: c.issueDate });
  });

  const LEADERBOARD = Array.from(studentMap.values()).sort((a, b) => b.weightage - a.weightage);

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const barMap = new Map();
  certificates.forEach(c => {
    const d = new Date(c.issueDate || Date.now());
    if (!isNaN(d.getTime())) {
      const m = monthNames[d.getMonth()];
      barMap.set(m, (barMap.get(m) || 0) + 1);
    }
  });
  const BAR_DATA = Array.from(barMap.entries()).map(([name, certs]) => ({ name, certs }));
  if (BAR_DATA.length === 0) BAR_DATA.push({ name: "Current", certs: 0 });

  const handleDownloadSection = (sectionName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const exportData = LEADERBOARD.map(s => ({
      ID: s.id, Name: s.name, Section: s.section,
      Certificates: s.certCount, Weightage: s.weightage, Status: "Active"
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData.length > 0 ? exportData : [{ Message: "No Data Found" }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Section_${sectionName}`);
    XLSX.writeFile(workbook, `Adamas_Section_${sectionName}_Report.xlsx`);
  };

  const stats = [
    { label: "Pending Audits", count: pendingCount, icon: <AlertCircle />, color: "bg-[#ef4444] text-white border-bg-dark shadow-[6px_6px_0_#000]" },
    { label: "Active Scholars", count: LEADERBOARD.length || 0, icon: <Users />, color: "bg-bg-surface text-text-primary border-bg-dark shadow-[6px_6px_0_#000]" },
    { label: "Total Issuance", count: totalIssued, icon: <FileCheck />, color: "bg-accent text-bg-dark border-bg-dark shadow-[6px_6px_0_#000]" },
  ];

  return (
    <DashboardLayout allowedRole="faculty" onRefresh={handleManualRefresh} isRefreshing={isRefreshing}>
      {/* Hero Header — GSAP revealed */}
      <div ref={heroRef}>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6 md:gap-8">
          <div>
            <h1 className="gsap-hero-title text-3xl xs:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight text-text-primary">
              WELCOME BACK,<br/>
              <span className="text-accent">{user?.name || "AUTHORITY"}</span>
            </h1>
          </div>
          <div className="gsap-hero-actions flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ x: 3, y: 3 }}
              onClick={(e) => handleDownloadSection("Global", e)}
              className="flex items-center gap-2 px-6 py-3 md:py-4 bg-zinc-900 border-3 border-bg-dark rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs text-white hover:shadow-[4px_4px_0_#000] transition-all"
            >
              <Download className="w-4 h-4" />
              Export Global Data
            </motion.button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ x: 3, y: 3 }}>
              <Link
                href="/faculty/certificates"
                className="flex items-center gap-2 px-8 py-3 md:py-4 bg-accent text-bg-dark border-3 border-bg-dark rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000] transition-all"
              >
                <Layers className="w-4 h-4" />
                Review Pending Queue
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Grid Stats — GSAP stagger */}
      <div
        ref={statCardContainerRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
      >
        {loading && certificates.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="gsap-card bento-card h-48 bg-bg-surface border-4 border-border animate-pulse rounded-[2rem] flex flex-col justify-between p-8">
              <div className="w-12 h-12 bg-bg-base rounded-xl" />
              <div className="space-y-3">
                <div className="h-12 bg-bg-base rounded-lg w-1/2" />
                <div className="h-4 bg-bg-base rounded w-3/4" />
              </div>
            </div>
          ))
        ) : (
          stats.map((stat, i) => (
            <div key={i} className="gsap-card">
              <motion.div whileHover={{ y: -3, scale: 1.01 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                <div className={`bento-card flex flex-col justify-between h-48 border-4 rounded-[2rem] ${stat.color}`}>
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-bg-surface rounded-xl flex items-center justify-center text-text-primary shadow-sm border-2 border-border">
                      {React.cloneElement(stat.icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
                    </div>
                    <ArrowUpRight className="w-6 h-6 opacity-30" />
                  </div>
                  <div>
                    <span className="text-6xl font-black tracking-tighter">{stat.count}</span>
                    <p className="text-sm font-bold uppercase tracking-tight mt-1 opacity-80">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          ))
        )}
      </div>

      {/* Analytics & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AnimatedSection delay={0.2}>
            <div className="bento-card border-4 border-text-primary p-6 md:p-8 flex-1">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest mb-6 text-text-primary">Ingestion Velocity</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={BAR_DATA}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 800 }} stroke="#52525b" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 800 }} stroke="#52525b" axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f4f4f5' }}
                      contentStyle={{ borderRadius: '12px', border: '3px solid #09090b', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="certs" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AnimatedSection>
          
          <AnimatedSection delay={0.3}>
            <div className="bento-card border-4 border-text-primary p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full text-center md:text-left">
                <h3 className="text-lg md:text-xl font-black uppercase tracking-widest mb-2 text-text-primary">Audit Distribution</h3>
                <p className="text-[10px] md:text-sm font-bold text-text-secondary mb-6 uppercase tracking-widest">Global Registry Status</p>
                <div className="space-y-3">
                  {PIE_DATA.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs md:text-sm font-black text-text-primary uppercase">{entry.name}</span>
                      </div>
                      <span className="text-xs md:text-sm font-bold text-text-secondary">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-40 w-40 md:h-48 md:w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PIE_DATA} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                      {PIE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '3px solid #09090b', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </AnimatedSection>
        </div>

        {/* Leaderboard */}
        <AnimatedSection delay={0.4}>
          <div className="bento-card border-4 border-text-primary p-0 overflow-hidden flex flex-col h-full">
            <div className="p-6 md:p-8 border-b-3 border-text-primary bg-bg-surface">
              <h3 className="text-lg md:text-xl font-black uppercase tracking-widest flex items-center gap-3 text-text-primary">
                <Award className="w-5 h-5 md:w-6 md:h-6 text-accent" />
                Top Scholars
              </h3>
              <p className="text-[10px] md:text-xs font-bold text-text-secondary mt-2 uppercase tracking-widest">Highest Weightage & Certs</p>
            </div>
            <div className="flex-1 divide-y-2 divide-border overflow-y-auto max-h-[400px] lg:max-h-none">
              {LEADERBOARD.map((student, idx) => (
                <motion.div
                  key={student.id}
                  whileHover={{ x: 4, backgroundColor: "var(--color-bg-base)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => setSelectedStudent(student)}
                  className="p-4 md:p-6 transition-colors group flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-bg-surface border-2 border-border flex items-center justify-center font-black text-[10px] md:text-xs text-text-secondary">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-xs md:text-sm text-text-primary uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4">{student.name}</p>
                      <p className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-widest">ROLL: {student.rollNumber} • SEC {student.section}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs md:text-sm text-accent">{student.weightage} pts</p>
                    <p className="text-[10px] md:text-xs font-bold text-text-secondary">{student.certCount} certs</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Registry Sections — GSAP stagger */}
      <AnimatedSection delay={0.5}>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8">REGISTRY SECTIONS</h2>
        <div
          ref={sectionCardContainerRef}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        >
          {(user?.sectionsManaged && user.sectionsManaged.length > 0 ? user.sectionsManaged : ["Global"]).map((section, i) => (
            <div key={i} className="gsap-card">
              <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                <div className="bento-card p-6 flex flex-col items-center text-center border-4 border-bg-dark relative overflow-hidden h-full bg-bg-surface group">
                  <button 
                    onClick={(e) => handleDownloadSection(section, e)}
                    className="absolute top-4 right-4 w-9 h-9 md:w-10 md:h-10 bg-bg-surface border-2 border-border rounded-lg md:rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-[2px_2px_0_var(--color-text-primary)] transition-all z-10 cursor-pointer"
                    title="Download Section Data"
                  >
                    <Download className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
                  </button>
                  <Link href={`/faculty/sections?section=${section}`} className="w-full flex flex-col items-center cursor-pointer pt-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-bg-dark text-text-on-dark flex items-center justify-center text-3xl md:text-4xl font-black mb-4 md:mb-6 transition-transform group-hover:scale-110 duration-300">
                      {section.charAt(0)}
                    </div>
                    <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-1 md:mb-2 group-hover:text-accent transition-colors">{section === 'Global' ? 'Global Cohort' : `Section ${section}`}</h4>
                    <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                      <span>{LEADERBOARD.filter(s => s.section === section || section === 'Global').length} Students</span>
                      <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                    </div>
                  </Link>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </AnimatedSection>

      {/* Student Detail Modal — GSAP animated */}
      <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </DashboardLayout>
  );
}
