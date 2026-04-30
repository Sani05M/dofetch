"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Search,
  ExternalLink,
  ChevronDown,
  X,
  Check,
  FileText,
  ExternalLink as ExternalLinkIcon,
  ShieldCheck,
  Layers,
  ArrowRight,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { TableRowSkeleton } from "@/components/SkeletonLoader";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { RatingBadge, Rating } from "@/components/RatingBadge";
import { useCertificates } from "@/hooks/useCertificates";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Student {
  id: string;
  rollNo: string;
  name: string;
  section: string;
}

export default function FacultySectionsPage() {
  const { user } = useAuth();
  const {
    certificates,
    updateStatus,
    loading: certsLoading,
  } = useCertificates();
  const [students, setStudents] = useState<Student[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Derive managed sections FIRST so fetchStudents can use them
  const managedSections = user?.sectionsManaged || [];
  const sections = ["All", ...managedSections];

  const fetchStudents = async () => {
    if (managedSections.length === 0) {
      setDbLoading(false);
      return;
    }
    try {
      setDbLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, section, roll_number")
        .eq("role", "student")
        .in("section", managedSections);

      if (error) throw error;

      setStudents(
        (data || []).map((p) => ({
          id: p.id,
          rollNo: p.roll_number || p.id.substring(0, 8).toUpperCase(),
          name: p.full_name,
          section: p.section || "N/A",
        })),
      );
    } catch (err) {
      console.error("Failed to fetch scholars:", err);
    } finally {
      setDbLoading(false);
    }
  };

  // Re-fetch whenever user (sections_managed) becomes available or changes
  React.useEffect(() => {
    if (user) fetchStudents();
  }, [user?.sectionsManaged?.join(",")]);

  const filteredStudents = students.filter((s) => {
    const matchesSection =
      activeSection === "All" || s.section === activeSection;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const handleExport = (format: "CSV" | "Excel") => {
    // Enrich data with certificate stats
    const dataToExport = filteredStudents.map((s) => {
      const certs = getStudentCerts(s.id);
      const verified = certs.filter((c) => c.status === "verified");
      const totalScore = certs.reduce((acc, c) => acc + (c.score || 0), 0);

      return {
        "Roll No": s.rollNo,
        "Student Name": s.name,
        Section: s.section,
        "Total Artifacts": certs.length,
        "Verified Artifacts": verified.length,
        "Pending Review": certs.filter((c) => c.status === "pending").length,
        "Academic Credits": totalScore,
        "Top Category":
          verified.length > 0
            ? totalScore / verified.length > 90
              ? "Platinum"
              : "Gold"
            : "N/A",
      };
    });

    const fileName = `adamos_audit_${activeSection === "All" ? "global" : `section_${activeSection}`}`;

    if (format === "CSV") {
      const csv = Papa.unparse(dataToExport);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileName}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Academic Audit");
      XLSX.writeFile(workbook, `${fileName}.xlsx`);
    }
    setExportMenuOpen(false);
  };

  // Get certificates for a specific student (Linked by full ID)
  const getStudentCerts = (studentId: string) => {
    return certificates.filter((c) => c.studentId === studentId);
  };

  // Loading handled by skeletons inline now

  return (
    <DashboardLayout allowedRole="faculty">
      <div className="space-y-12">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-accent font-black text-[10px] md:text-xs uppercase tracking-[0.3em] mb-4"
          >
            <Layers className="w-4 h-4" />
            Registry Management
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-text-primary leading-none">
            Institutional Sections
          </h1>
          <p className="text-text-secondary text-sm font-bold uppercase tracking-widest opacity-60">
            Manage student credentials across academic clusters.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-2 p-1.5 bg-bg-surface border-2 border-border rounded-xl md:rounded-2xl overflow-x-auto no-scrollbar shadow-[4px_4px_0_#000] md:shadow-none">
            {sections.map((s) => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={cn(
                  "px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest",
                  activeSection === s
                    ? "bg-accent text-[#09090b] shadow-[2px_2px_0_#09090b]"
                    : "text-text-secondary hover:text-text-primary hover:bg-bg-base",
                )}
              >
                {s === "All" ? "Global" : `Sec ${s}`}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:flex-1 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Filter by name or ID..."
                className="w-full bg-bg-surface border-2 border-border pl-12 pr-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-text-primary focus:outline-none focus:border-accent transition-all shadow-[4px_4px_0_#000]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="relative z-20 w-full sm:w-auto">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="w-full h-12 md:h-14 px-6 bg-accent hover:bg-accent/90 text-[#09090b] rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0_#09090b] active:translate-y-[2px] active:shadow-[2px_2px_0_#09090b]"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>

              <AnimatePresence>
                {exportMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setExportMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-[calc(100%+0.5rem)] w-full sm:w-48 bg-bg-surface border-3 border-border rounded-xl md:rounded-2xl shadow-[8px_8px_0_#09090b] p-2 z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => handleExport("CSV")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-base rounded-lg md:rounded-xl text-left transition-colors"
                      >
                        <FileText className="w-4 h-4 text-accent" />
                        <div>
                          <p className="text-[10px] md:text-xs font-black text-text-primary uppercase tracking-widest">
                            CSV
                          </p>
                          <p className="text-[8px] md:text-[10px] font-bold text-text-secondary uppercase">
                            Plain text format
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={() => handleExport("Excel")}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-base rounded-lg md:rounded-xl text-left transition-colors mt-1"
                      >
                        <FileSpreadsheet className="w-4 h-4 text-accent" />
                        <div>
                          <p className="text-[10px] md:text-xs font-black text-text-primary uppercase tracking-widest">
                            Excel
                          </p>
                          <p className="text-[8px] md:text-[10px] font-bold text-text-secondary uppercase">
                            Rich data format
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bento-card border-3 border-border rounded-2xl p-0 overflow-hidden bg-bg-surface shadow-[4px_4px_0_#000]">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className="border-b-3 border-border bg-bg-base">
                  <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">
                    Roll No
                  </th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">
                    Student Identity
                  </th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">
                    Cluster
                  </th>
                  <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">
                    Status
                  </th>
                  <th className="px-6 md:px-8 py-4 md:py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-border">
                {certsLoading || dbLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-bg-base border-2 border-border flex items-center justify-center">
                          <Layers className="w-5 h-5 text-text-secondary" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-text-secondary">
                          No students in{" "}
                          {activeSection === "All"
                            ? "any managed section"
                            : `Section ${activeSection}`}{" "}
                          yet
                        </p>
                        <p className="text-[10px] text-text-secondary/50">
                          Students will appear here once they set their section
                          in their profile
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.rollNo}
                      onClick={() => setSelectedStudent(student)}
                      className="group hover:bg-bg-base transition-colors cursor-pointer"
                    >
                      <td className="px-6 md:px-8 py-5 md:py-6 text-[10px] md:text-xs font-black text-text-secondary group-hover:text-text-primary transition-colors">
                        {student.rollNo}
                      </td>
                      <td className="px-6 md:px-8 py-5 md:py-6">
                        <p className="text-xs md:text-sm font-black text-text-primary uppercase tracking-tight">
                          {student.name}
                        </p>
                      </td>
                      <td className="px-6 md:px-8 py-5 md:py-6">
                        <span className="px-2 md:px-3 py-1 rounded-md bg-bg-surface border-2 border-border text-[8px] md:text-[10px] font-black text-text-secondary uppercase tracking-widest">
                          Section {student.section}
                        </span>
                      </td>
                      <td className="px-6 md:px-8 py-5 md:py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary">
                            Active
                          </span>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5 md:py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-accent">
                            Review
                          </span>
                          <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-accent" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      {mounted &&
        createPortal(
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
                  className="relative w-full max-w-5xl bg-bg-surface border-3 md:border-4 border-border rounded-[1.5rem] md:rounded-[2.5rem] shadow-[12px_12px_0_var(--color-text-primary)] overflow-hidden flex flex-col max-h-[90vh] z-10"
                >
                  {/* Modal Header */}
                  <div className="shrink-0 p-6 md:p-10 border-b-3 md:border-b-4 border-border bg-bg-base flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-accent border-3 border-bg-dark flex items-center justify-center text-3xl md:text-4xl font-black text-[#09090b] shadow-[4px_4px_0_var(--color-text-primary)] shrink-0">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 mb-1 md:mb-2">
                          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-text-primary truncate">
                            {selectedStudent.name}
                          </h2>
                          <div className="inline-flex px-3 py-1 bg-accent border-2 border-bg-dark rounded-lg text-[8px] md:text-[10px] font-black text-[#09090b] uppercase tracking-widest w-fit">
                            Section {selectedStudent.section}
                          </div>
                        </div>
                        <p className="text-text-secondary font-bold text-[10px] md:text-xs tracking-widest uppercase opacity-70 truncate">
                          ID: {selectedStudent.rollNo}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-bg-surface border-2 md:border-3 border-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all self-end sm:self-center"
                    >
                      <X className="w-5 h-5 md:w-7 md:h-7 stroke-[3px]" />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-bg-surface">
                    <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-text-secondary mb-6 md:mb-8 ml-1">
                      Submitted Artifacts
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                      {getStudentCerts(selectedStudent.id).map((cert) => (
                        <motion.div
                          layoutId={cert.id}
                          key={cert.id}
                          className="bg-bg-base border-3 border-border rounded-[2rem] p-6 md:p-8 flex flex-col justify-between hover:border-text-primary transition-all group relative"
                        >
                          {/* Status Watermark */}
                          <div className="absolute -right-2 -top-2 opacity-[0.03] pointer-events-none overflow-hidden">
                            <FileText className="w-32 h-32 rotate-12" />
                          </div>

                          <div className="space-y-6 md:space-y-8 relative z-10">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-4 md:gap-5 min-w-0">
                                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-bg-surface border-3 border-border flex items-center justify-center text-text-secondary group-hover:text-accent group-hover:border-accent transition-colors shrink-0 shadow-[4px_4px_0_var(--color-border)]">
                                  <FileText className="w-7 h-7 md:w-8 md:h-8" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="text-lg md:text-xl font-black text-text-primary leading-tight uppercase tracking-tight truncate">
                                      {cert.title}
                                    </h4>
                                    {cert.score > 0 && (
                                      <span className="text-[10px] font-mono opacity-50 bg-bg-surface px-1.5 rounded border border-border">
                                        {cert.score}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-text-secondary uppercase tracking-widest font-black opacity-60 truncate">
                                    {cert.issuer}
                                  </p>
                                </div>
                              </div>
                              <div className="shrink-0 pt-1">
                                <RatingBadge
                                  rating={
                                    cert.status === "pending"
                                      ? "Pending"
                                      : (cert.rating as Rating)
                                  }
                                  className="shadow-sm"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                              <div className="px-4 py-2.5 bg-bg-surface border-2 border-border rounded-xl flex items-center justify-between">
                                <span className="opacity-50">Type</span>
                                <span className="text-text-primary">
                                  {cert.fileType}
                                </span>
                              </div>
                              <div className="px-4 py-2.5 bg-bg-surface border-2 border-border rounded-xl flex items-center justify-between">
                                <span className="opacity-50">Issued</span>
                                <span className="text-text-primary">
                                  {cert.issueDate}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pt-8 mt-8 border-t-3 border-border relative z-10">
                            {cert.status === "pending" ? (
                              <>
                                <button
                                  onClick={() =>
                                    updateStatus(cert.id, "verified")
                                  }
                                  className="flex-1 bg-green-500 text-bg-dark py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:translate-y-[-2px] hover:shadow-[4px_4px_0_#09090b] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2"
                                >
                                  <Check className="w-4 h-4 stroke-[4px]" />{" "}
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    updateStatus(cert.id, "rejected")
                                  }
                                  className="flex-1 bg-bg-surface text-text-primary border-2 border-border py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-zinc-100 flex items-center justify-center gap-2"
                                >
                                  <X className="w-4 h-4 stroke-[4px]" /> Reject
                                </button>
                              </>
                            ) : (
                              <div
                                className={cn(
                                  "w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 border-2 md:border-3 shadow-inner",
                                  cert.status === "verified" ||
                                    cert.status === "approved"
                                    ? "bg-green-500/10 border-green-500 text-green-600"
                                    : "bg-red-500/10 border-red-500 text-red-600",
                                )}
                              >
                                {cert.status === "verified" ||
                                cert.status === "approved" ? (
                                  <>
                                    <Check className="w-4 h-4 stroke-[4px]" />{" "}
                                    Verification Passed
                                  </>
                                ) : (
                                  <>
                                    <X className="w-4 h-4 stroke-[4px]" />{" "}
                                    Submission Rejected
                                  </>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() =>
                                window.open(
                                  `/api/view/${cert.fileId}`,
                                  "_blank",
                                )
                              }
                              className="w-14 h-14 bg-bg-surface border-2 border-border rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-primary hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all shrink-0"
                            >
                              <ExternalLinkIcon className="w-6 h-6" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="shrink-0 p-6 md:p-10 border-t-3 md:border-t-4 border-border bg-bg-base flex justify-end">
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="w-full sm:w-auto px-8 md:px-12 py-3.5 md:py-4 bg-accent text-bg-dark rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#09090b] transition-all shadow-[4px_4px_0_#09090b] active:translate-y-[1px] active:shadow-none"
                    >
                      Close Session
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </DashboardLayout>
  );
}
