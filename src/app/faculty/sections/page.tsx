"use client";

import React, { useState } from "react";
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
  ArrowRight
} from "lucide-react";
import { RatingBadge, Rating } from "@/components/RatingBadge";
import { useCertificates } from "@/hooks/useCertificates";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Student {
  rollNo: string;
  name: string;
  section: string;
}

const MOCK_STUDENTS: Student[] = [
  { rollNo: "22CS001", name: "Abhishek Singh", section: "A" },
  { rollNo: "22CS002", name: "Aditi Verma", section: "A" },
  { rollNo: "22CS015", name: "Ishan Sharma", section: "B" },
  { rollNo: "22CS024", name: "Kavya Das", section: "C" },
  { rollNo: "22CS031", name: "Manish Raj", section: "A" },
  { rollNo: "22CS042", name: "Pooja Hegde", section: "B" },
  { rollNo: "22CS055", name: "Rohan Gupta", section: "A" },
  { rollNo: "22CS068", name: "Sanya Malhotra", section: "C" },
];

export default function FacultySectionsPage() {
  const { certificates, updateStatus, loading } = useCertificates();
  const [activeSection, setActiveSection] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const sections = ["All", "A", "B", "C", "D", "E", "F"];

  const filteredStudents = MOCK_STUDENTS.filter(s => {
    const matchesSection = activeSection === "All" || s.section === activeSection;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.rollNo.toLowerCase().includes(search.toLowerCase());
    return matchesSection && matchesSearch;
  });

  // Get certificates for a specific student (mock logic: matching by name char for demo)
  const getStudentCerts = (rollNo: string) => {
    // In a real app, certs would have a studentRollNo field
    // For this mock demo, we'll just show all certs for every student so we can test the UI
    return certificates; 
  };

  if (loading) return null;

  return (
    <DashboardLayout allowedRole="faculty">
      <div className="space-y-12">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-[0.3em] mb-4"
          >
            <Layers className="w-4 h-4" />
            Registry Management
          </motion.div>
          <h1 className="text-4xl font-display italic text-text-primary">Institutional Sections</h1>
          <p className="text-text-secondary mt-2 text-lg">Manage student credentials across academic clusters.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-2 p-1.5 bg-bg-surface/50 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar">
            {sections.map(s => (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap uppercase tracking-widest",
                  activeSection === s 
                    ? "bg-accent text-white shadow-xl shadow-accent/20" 
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                )}
              >
                {s === "All" ? "Global" : `Section ${s}`}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Filter by name or ID..."
              className="w-full bg-bg-surface/50 border border-white/5 pl-12 pr-6 py-4 rounded-2xl text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent transition-all hover:bg-white/5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bento-card bg-white border-3 border-bg-dark shadow-[4px_4px_0_#09090b] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-3 border-bg-dark bg-zinc-50">
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">Roll No</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">Student Identity</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">Cluster</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-200">
                {filteredStudents.map((student) => (
                  <tr 
                    key={student.rollNo} 
                    onClick={() => setSelectedStudent(student)}
                    className="group hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <td className="px-8 py-6 text-xs font-black text-zinc-500 group-hover:text-bg-dark transition-colors">
                      {student.rollNo}
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-bg-dark">{student.name}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-md bg-zinc-100 border border-zinc-200 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        Section {student.section}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Active</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Review Vault</span>
                        <ArrowRight className="w-4 h-4 text-accent" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-bg-base/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-5xl bg-bg-surface border border-white/5 rounded-[3rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(99,102,241,0.2)] flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-bg-elevated border border-white/5 flex items-center justify-center text-3xl font-display italic text-accent">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-3xl font-display italic text-text-primary">{selectedStudent.name}</h2>
                      <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
                        Section {selectedStudent.section}
                      </div>
                    </div>
                    <p className="text-text-secondary font-mono text-xs tracking-widest uppercase">
                      Identification Hash: {selectedStudent.rollNo}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="w-12 h-12 rounded-2xl bg-bg-elevated border border-white/5 flex items-center justify-center text-text-muted hover:text-text-primary hover:border-white/20 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-10 bg-dot-pattern">
                <h3 className="text-[10px] uppercase tracking-[0.4em] text-text-muted font-bold mb-8 ml-1">Submitted Artifacts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {getStudentCerts(selectedStudent.rollNo).map((cert) => (
                    <motion.div 
                      layoutId={cert.id}
                      key={cert.id} 
                      className="bg-bg-base/80 border border-white/5 rounded-[2rem] p-8 space-y-8 glass-card"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-white/5 flex items-center justify-center text-accent">
                            <FileText className="w-7 h-7" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-text-primary leading-tight">{cert.title}</h4>
                            <p className="text-[11px] text-text-muted mt-2 uppercase tracking-widest font-semibold">{cert.issuer}</p>
                          </div>
                        </div>
                        <RatingBadge rating={cert.status === "pending" ? "Pending" : cert.rating as Rating} />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                        <div className="px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                          Type: <span className="text-text-primary ml-1">{cert.fileType}</span>
                        </div>
                        <div className="px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl">
                          Date: <span className="text-text-primary ml-1">{cert.issueDate}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                        {cert.status === "pending" ? (
                          <>
                            <button 
                              onClick={() => updateStatus(cert.id, "verified", "Platinum")}
                              className="flex-1 bg-success text-bg-base py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4 stroke-[3px]" /> Accept
                            </button>
                            <button 
                              onClick={() => updateStatus(cert.id, "rejected")}
                              className="flex-1 bg-white/[0.05] hover:bg-accent text-text-primary py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] border border-white/5 transition-all flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4 stroke-[3px]" /> Reject
                            </button>
                          </>
                        ) : (
                          <div className={cn(
                            "w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-white/5",
                            cert.status === "verified" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                          )}>
                            {cert.status === "verified" ? (
                              <><Check className="w-4 h-4" /> Audit Passed</>
                            ) : (
                              <><X className="w-4 h-4" /> Entry Rejected</>
                            )}
                          </div>
                        )}
                        <button className="w-14 h-14 bg-bg-elevated border border-white/5 rounded-xl flex items-center justify-center text-text-muted hover:text-text-primary transition-all shrink-0">
                          <ExternalLinkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 border-t border-white/5 bg-white/[0.02] flex justify-end">
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="px-10 py-4 bg-accent text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-accent/20"
                >
                  Close Session
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
