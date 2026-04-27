"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Zap
} from "lucide-react";

import { useCertificates } from "@/hooks/useCertificates";

export default function FacultyCertificatesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { certificates } = useCertificates();

  const formattedCerts = certificates.map(c => ({
    id: c.id,
    studentName: c.studentName || "Unknown Scholar",
    rollNo: c.studentId.substring(0, 8),
    section: "Global",
    certName: c.title,
    issuer: c.issuer,
    status: c.status,
    date: c.issueDate
  }));

  const filtered = formattedCerts.filter(c => 
    (c.studentName.toLowerCase().includes(search.toLowerCase()) || c.certName.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "All" || c.status === statusFilter.toLowerCase())
  );

  return (
    <DashboardLayout allowedRole="faculty">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 md:mb-16 gap-8">
        <div>
          <h1 className="text-4xl xs:text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-6 text-text-primary">
            AUDIT<br/>
            <span className="text-accent">QUEUE</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative w-full md:w-96">
              <input 
                type="text" 
                placeholder="Search students..." 
                className="input-field pl-12 w-full bg-bg-surface border-2 border-border p-4 rounded-xl font-bold text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-bg-surface border-3 md:border-4 border-border p-1.5 rounded-xl md:rounded-2xl overflow-x-auto no-scrollbar shadow-[4px_4px_0_#000] md:shadow-none">
          {["All", "Verified", "Pending", "Rejected"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-lg transition-all font-black uppercase tracking-widest text-[10px] md:text-xs whitespace-nowrap ${
                statusFilter === s 
                  ? "bg-accent text-[#000] shadow-[2px_2px_0_#000]" 
                  : "text-text-secondary hover:bg-bg-base hover:text-text-primary"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bento-card border-3 border-border rounded-2xl p-0 overflow-hidden bg-bg-surface shadow-[4px_4px_0_#000]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b-4 border-border bg-bg-base">
                <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">Student Identity</th>
                <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">Academic Artifact</th>
                <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary">Current Status</th>
                <th className="px-6 md:px-8 py-4 md:py-5 text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-border">
              {filtered.map((cert) => {
                const isVerified = cert.status === "verified";
                const isPending = cert.status === "pending";
                return (
                  <tr key={cert.id} className="group hover:bg-accent transition-colors cursor-pointer">
                    <td className="px-6 md:px-8 py-5 md:py-6">
                      <p className="font-black text-base md:text-lg text-text-primary group-hover:text-[#09090b] uppercase tracking-tight group-hover:underline decoration-3 underline-offset-4">{cert.studentName}</p>
                      <p className="text-[10px] md:text-xs font-bold text-text-secondary group-hover:text-[#09090b]/80 uppercase tracking-widest">{cert.rollNo} • SEC {cert.section}</p>
                    </td>
                    <td className="px-6 md:px-8 py-5 md:py-6">
                      <p className="font-black text-base md:text-lg text-text-primary group-hover:text-[#09090b] uppercase tracking-tight group-hover:underline decoration-3 underline-offset-4">{cert.certName}</p>
                      <p className="text-[10px] md:text-xs font-bold text-text-secondary group-hover:text-[#09090b]/80 uppercase tracking-widest">{cert.issuer}</p>
                    </td>
                    <td className="px-6 md:px-8 py-5 md:py-6">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border-2 text-[10px] md:text-xs font-black uppercase tracking-widest ${
                        isVerified ? "bg-green-500 text-bg-dark border-bg-dark group-hover:bg-[#09090b] group-hover:text-green-400 group-hover:border-[#09090b]" :
                        isPending ? "bg-yellow-500 text-bg-dark border-bg-dark group-hover:bg-[#09090b] group-hover:text-yellow-400 group-hover:border-[#09090b]" :
                        "bg-red-500 text-bg-dark border-bg-dark group-hover:bg-[#09090b] group-hover:text-red-400 group-hover:border-[#09090b]"
                      }`}>
                        {cert.status}
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-5 md:py-6 text-right">
                      <Link href={`/faculty/certificates/${cert.id}`} className="inline-flex p-3 border-2 border-border rounded-xl hover:bg-[#09090b] hover:border-[#09090b] hover:text-white transition-all text-text-primary bg-bg-base group-hover:border-[#09090b] shadow-[2px_2px_0_var(--color-border)]">
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
