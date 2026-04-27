"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useCertificates } from "@/hooks/useCertificates";
import { ShieldCheck, Users, FileCheck, AlertCircle, ArrowUpRight, Layers, Download, X, FileText, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "framer-motion";

import { AnimatedSection, containerVariants, itemVariants } from "@/components/AnimatedSection";
import { useAuth } from "@/context/AuthContext";
import { RegistryGraph } from "@/components/RegistryGraph";

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { certificates } = useCertificates();
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const pendingCount = certificates.filter(c => c.status === "pending").length;
  const verifiedCount = certificates.filter(c => c.status === "verified" || c.status === "approved").length;
  const rejectedCount = certificates.filter(c => c.status === "rejected").length;

  // Real-time PIE Chart
  const PIE_DATA = [
    { name: "Verified", value: verifiedCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#facc15" },
    { name: "Rejected", value: rejectedCount, color: "#ef4444" },
  ];

  // Real-time Leaderboard
  const studentMap = new Map();
  certificates.forEach(c => {
    if (!studentMap.has(c.studentId)) {
      studentMap.set(c.studentId, {
        id: c.studentId.substring(0, 8), // Short ID
        name: c.studentName || "Unknown Student",
        section: c.section || "N/A",
        certCount: 0,
        weightage: 0,
        certs: []
      });
    }
    const s = studentMap.get(c.studentId);
    s.certCount += 1;
    s.weightage += parseInt(c.rating || "0") || 0;
    s.certs.push({
      id: c.id,
      name: c.title,
      issuer: c.issuer,
      date: c.issueDate
    });
  });

  const LEADERBOARD = Array.from(studentMap.values()).sort((a, b) => b.weightage - a.weightage);

  // Real-time Bar Chart
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
  if (BAR_DATA.length === 0) {
    BAR_DATA.push({ name: "Current", certs: 0 });
  }

  const stats = [
    { label: "Pending Audits", count: pendingCount, icon: <AlertCircle />, color: "bg-[#ef4444] text-white border-bg-dark shadow-[6px_6px_0_#000]" },
    { label: "Active Scholars", count: LEADERBOARD.length || 1, icon: <Users />, color: "bg-bg-surface text-text-primary border-bg-dark shadow-[6px_6px_0_#000]" },
    { label: "Total Issuance", count: certificates.length, icon: <FileCheck />, color: "bg-accent text-bg-dark border-bg-dark shadow-[6px_6px_0_#000]" },
  ];

  const handleDownloadSection = (sectionName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Export logic for the entire section (Now uses live data)
    const exportData = LEADERBOARD.map(s => ({
      ID: s.id,
      Name: s.name,
      Section: s.section,
      Certificates: s.certCount,
      Weightage: s.weightage,
      Status: "Active"
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData.length > 0 ? exportData : [{ Message: "No Data Found" }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Section_${sectionName}`);
    XLSX.writeFile(workbook, `Adamas_Section_${sectionName}_Report.xlsx`);
  };

  return (
    <DashboardLayout allowedRole="faculty">
      {/* Hero Header */}
      <AnimatedSection>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6 md:gap-8">
          <div>
            <h1 className="text-3xl xs:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none text-text-primary">
              WELCOME BACK,<br/>
              <span className="text-accent">{user?.name || "AUTHORITY"}</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <button 
              onClick={(e) => handleDownloadSection("Global", e)}
              className="btn-primary shrink-0 bg-bg-surface text-text-primary border-3 border-text-primary hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all"
            >
              <Download className="w-5 h-5" />
              Export Global Data
            </button>
            <Link href="/faculty/certificates" className="btn-primary shrink-0">
              <Layers className="w-5 h-5" />
              Review Pending Queue
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* Grid Stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
      >
        {stats.map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <div className={`bento-card flex flex-col justify-between h-48 border-4 ${stat.color}`}>
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
        ))}
      </motion.div>

      {/* Analytics & Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
        {/* Charts Section */}
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
                    <Bar 
                      dataKey="certs" 
                      fill="var(--color-accent)" 
                      radius={[4, 4, 0, 0]}
                    />
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
                    <Pie
                      data={PIE_DATA}
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
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

        {/* Leaderboard Section */}
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
                <div 
                  key={student.id} 
                  onClick={() => setSelectedStudent(student)}
                  className="p-4 md:p-6 hover:bg-bg-base transition-colors group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-bg-surface border-2 border-border flex items-center justify-center font-black text-[10px] md:text-xs text-text-secondary">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-xs md:text-sm text-text-primary uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4">{student.name}</p>
                      <p className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-widest">{student.id} • SEC {student.section}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xs md:text-sm text-accent">{student.weightage} pts</p>
                    <p className="text-[10px] md:text-xs font-bold text-text-secondary">{student.certCount} certs</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Registry Graph Section */}
      <AnimatedSection delay={0.45}>
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">Academic Mesh</h2>
              <p className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-widest">Interactive Relationship Mapping</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-bg-surface border-2 border-bg-dark rounded-lg text-[10px] font-black uppercase">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Live Linkages
            </div>
          </div>
          <RegistryGraph />
        </div>
      </AnimatedSection>

      {/* Quick Links / Clusters */}
      <AnimatedSection delay={0.5}>
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-8">REGISTRY SECTIONS</h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        >
          {[
            { label: "Global Cohort", count: LEADERBOARD.length || 0, icon: "G" },
          ].map((cluster, i) => (
            <motion.div key={i} variants={itemVariants}>
              <div className="bento-card p-6 flex flex-col items-center text-center border-4 border-bg-dark relative overflow-hidden h-full bg-bg-surface">
                <button 
                  onClick={(e) => handleDownloadSection(cluster.label, e)}
                  className="absolute top-4 right-4 w-9 h-9 md:w-10 md:h-10 bg-bg-surface border-2 border-border rounded-lg md:rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-[2px_2px_0_var(--color-text-primary)] transition-all z-10 cursor-pointer"
                  title="Download Section Data"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
                </button>

                <Link href="/faculty/certificates" className="w-full flex flex-col items-center cursor-pointer pt-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-bg-dark text-text-on-dark flex items-center justify-center text-3xl md:text-4xl font-black mb-4 md:mb-6 transition-transform duration-300">
                    {cluster.icon}
                  </div>
                  <h4 className="text-lg md:text-xl font-black uppercase tracking-tight mb-1 md:mb-2 group-hover:text-accent transition-colors">{cluster.label}</h4>
                  <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-text-secondary group-hover:text-text-primary transition-colors">
                    <span>{cluster.count} Students</span>
                    <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatedSection>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm cursor-pointer"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-4xl bg-bg-surface border-3 md:border-4 border-border rounded-[1.5rem] md:rounded-[2rem] shadow-[8px_8px_0_var(--color-text-primary)] md:shadow-[12px_12px_0_var(--color-text-primary)] overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 border-b-3 md:border-b-4 border-border bg-bg-base flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] bg-accent border-3 border-bg-dark flex items-center justify-center text-3xl md:text-4xl font-black text-[#09090b] shadow-[4px_4px_0_var(--color-text-primary)] shrink-0">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-text-primary mb-1 truncate">{selectedStudent.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <span className="px-2 py-0.5 md:px-3 md:py-1 bg-bg-surface border-2 border-border rounded-lg text-[10px] md:text-xs font-black text-text-secondary uppercase tracking-widest whitespace-nowrap">
                        Section {selectedStudent.section}
                      </span>
                      <span className="text-text-secondary font-bold text-[10px] md:text-xs uppercase tracking-widest truncate">
                        ID: {selectedStudent.id}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-bg-surface border-2 md:border-3 border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all self-end sm:self-center"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6 stroke-[3px]" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-bg-surface">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
                  <div className="bento-card p-5 md:p-6 border-3 border-text-primary bg-accent shadow-[4px_4px_0_var(--color-text-primary)] text-[#09090b]">
                    <p className="text-xs md:text-sm font-black uppercase tracking-widest opacity-70 mb-1 md:mb-2">Total Weightage</p>
                    <p className="text-3xl md:text-5xl font-black tracking-tighter">{selectedStudent.weightage}</p>
                  </div>
                  <div className="bento-card p-5 md:p-6 border-3 border-text-primary bg-bg-base shadow-[4px_4px_0_var(--color-text-primary)]">
                    <p className="text-xs md:text-sm font-black uppercase tracking-widest text-text-secondary mb-1 md:mb-2">Verified Certificates</p>
                    <p className="text-3xl md:text-5xl font-black tracking-tighter text-text-primary">{selectedStudent.certCount}</p>
                  </div>
                </div>
                
                <h3 className="text-xs md:text-lg font-black uppercase tracking-widest text-text-secondary mb-4">Recent Submissions</h3>
                <div className="space-y-4">
                  {selectedStudent.certs.map((cert: any) => (
                    <div key={cert.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 border-2 md:border-3 border-border rounded-xl md:rounded-2xl hover:border-text-primary transition-colors group gap-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-bg-base flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:bg-accent/10 transition-colors shrink-0">
                          <FileText className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-text-primary uppercase tracking-tight text-base md:text-lg truncate">{cert.name}</p>
                          <p className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-widest truncate">{cert.issuer} • {cert.date}</p>
                        </div>
                      </div>
                      <button className="w-full md:w-auto text-center px-4 md:px-6 py-2.5 md:py-3 bg-bg-surface border-2 border-border text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary rounded-lg md:rounded-xl hover:bg-bg-dark hover:border-bg-dark hover:text-text-on-dark transition-all">
                        View Audit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
