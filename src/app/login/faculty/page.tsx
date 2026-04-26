"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CustomSelect } from "@/components/CustomSelect";

const BATCH_OPTIONS = [
  { label: "2021 - 2025", value: "2021-2025" },
  { label: "2022 - 2026", value: "2022-2026" },
  { label: "2023 - 2027", value: "2023-2027" },
  { label: "2024 - 2028", value: "2024-2028" },
];

const DEPT_OPTIONS = [
  { label: "Computer Science (CSE)", value: "CSE" },
  { label: "Electronics (ECE)", value: "ECE" },
  { label: "Mechanical Eng.", value: "MECH" },
  { label: "Civil Eng.", value: "CIVIL" },
  { label: "Business Admin (BBA)", value: "BBA" },
  { label: "School of Law", value: "LAW" },
];

const SECTION_OPTIONS = [
  { label: "Section A", value: "A" },
  { label: "Section B", value: "B" },
  { label: "Section C", value: "C" },
  { label: "Section D", value: "D" },
  { label: "Section E", value: "E" },
  { label: "Section F", value: "F" },
];

export default function FacultyLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batch, setBatch] = useState("");
  const [dept, setDept] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [sections, setSections] = useState<string[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: "FAC2024001",
      name: "Dr. Faculty",
      email: email || "admin@adamas.edu",
      role: "faculty",
      facultyId: facultyId || "FAC-CS-001",
      sectionsManaged: sections.length > 0 ? sections.map(s => `CS-${s}`) : ["CS-A", "CS-B"],
    });
    router.push("/faculty/dashboard");
  };

  return (
    <div className="min-h-screen bg-bg-surface flex flex-col md:flex-row-reverse font-sans selection:bg-red-400 selection:text-white">
      {/* Right side: Form (Reversed for faculty) */}
      <div className="w-full md:w-[45%] bg-white p-8 md:p-16 flex flex-col justify-center border-l-4 border-zinc-200">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center transform rotate-45">
              <ShieldCheck className="w-4 h-4 text-white -rotate-45" />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase">ADAMAS REGISTRY</span>
          </Link>

          <h1 className="text-5xl font-black uppercase tracking-tighter leading-none mb-4">
            FACULTY<br />
            <span className="text-red-500">AUTHORITY</span>
          </h1>
          <p className="text-zinc-500 font-bold mb-10 text-sm uppercase tracking-widest">
            Authenticate to access registry controls
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Authority ID (Email)</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field border-zinc-200 focus:border-red-500"
                placeholder="admin@adamas.edu"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Batch</label>
                <CustomSelect 
                  options={BATCH_OPTIONS}
                  value={batch}
                  onChange={setBatch}
                  placeholder="Select Batch"
                  className="[&>button]:focus:border-red-500 [&>button]:hover:border-zinc-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Department</label>
                <CustomSelect 
                  options={DEPT_OPTIONS}
                  value={dept}
                  onChange={setDept}
                  placeholder="Select Dept"
                  className="[&>button]:focus:border-red-500 [&>button]:hover:border-zinc-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Faculty ID No.</label>
                <input 
                  type="text" 
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  className="input-field border-zinc-200 focus:border-red-500"
                  placeholder="e.g. FAC-2024"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Sections Managed</label>
                <CustomSelect 
                  options={SECTION_OPTIONS}
                  value={sections}
                  onChange={setSections}
                  multiple={true}
                  placeholder="Select Sections"
                  className="[&>button]:focus:border-red-500 [&>button]:hover:border-zinc-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-2">Master Key</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field border-zinc-200 focus:border-red-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="w-full btn-primary bg-red-500 text-white hover:shadow-[0_8px_30px_rgba(239,68,68,0.5)] py-4 text-lg">
              Authorize
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Level 4 Access <span className="text-red-500 font-black">Restricted Area</span>
            </p>
          </div>
        </div>
      </div>

      {/* Left side: Branding/Visual */}
      <div className="hidden md:flex w-[55%] p-12 items-center justify-center relative overflow-hidden bg-bg-dark">
        <div className="absolute inset-0 bg-dot-pattern opacity-10 mix-blend-overlay" />
        
        <div className="relative z-10 max-w-lg w-full">
          <div className="bento-card bg-zinc-900 border-zinc-800 p-12 text-center shadow-2xl -rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="w-16 h-16 bg-red-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 border-4 border-bg-dark">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">
              CONTROL THE REGISTRY.
            </h2>
            <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest mb-8">
              Verify artifacts, audit student submissions, and maintain the integrity of the Adamas University academic mesh.
            </p>
            
            <div className="flex flex-col gap-3 text-white">
              {[
                "Audit Pending Artifacts",
                "Revoke Credentials",
                "Maintain Registry Integrity"
              ].map((item, i) => (
                <div key={i} className="bg-bg-dark border-2 border-zinc-800 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-red-500 shrink-0" />
                  <span className="font-black text-sm uppercase tracking-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
