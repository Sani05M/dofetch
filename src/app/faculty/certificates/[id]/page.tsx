"use client";

import React, { useState, useEffect, use, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  User,
  Calendar,
  Loader2,
  Zap,
  RefreshCcw
} from "lucide-react";

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const unwrappedParams = use(params);
  const certId = unwrappedParams.id;

  useEffect(() => {
    if (certificate?.telegram_file_id) {
      loadPreview();
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [certificate?.telegram_file_id]);

  const loadPreview = async () => {
    if (!certificate?.telegram_file_id) return;
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`/api/view/${certificate.telegram_file_id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const [overrideScore, setOverrideScore] = useState<number>(0);

  const fetchCert = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*, profiles(*)")
        .eq("id", certId)
        .single();

      if (error) throw error;
      setCertificate(data);
      setOverrideScore(data.score || 0);
    } catch (err) {
      console.error("Error fetching certificate:", err);
    } finally {
      setLoading(false);
    }
  }, [certId]);

  useEffect(() => {
    fetchCert();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchCert, 5000);
    return () => clearInterval(interval);
  }, [fetchCert]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCert();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleAudit = async (status: "approved" | "rejected") => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: certId, status, score: overrideScore }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }

      router.push("/faculty/certificates");
    } catch (err: any) {
      console.error("Audit update failed:", err);
      alert(err.message || "Failed to update status.");
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout allowedRole="faculty">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-accent" />
          <p className="mt-4 font-black uppercase tracking-widest text-text-secondary">Initializing Secure Viewer...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!certificate) {
    return (
      <DashboardLayout allowedRole="faculty">
        <div className="text-center py-20">
          <h2 className="text-2xl font-black uppercase">Artifact Not Found</h2>
          <p className="mt-4 text-text-secondary">The requested registry entry does not exist or has been purged.</p>
          <Link href="/faculty/certificates" className="mt-8 inline-block btn-primary">Return to Queue</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout allowedRole="faculty">
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-6 h-[calc(100vh-120px)] flex flex-col">
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-6">
            <Link 
              href="/faculty/certificates" 
              className="w-10 h-10 bg-white border-3 border-bg-dark rounded-xl flex items-center justify-center shadow-[4px_4px_0_#000] hover:bg-accent transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <ArrowLeft className="w-5 h-5 text-bg-dark" strokeWidth={3} />
            </Link>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-bg-dark">
              Audit <span className="text-zinc-300">Terminal</span>
            </h1>
          </div>
          <div className={`px-6 py-2 rounded-2xl border-4 border-bg-dark font-black uppercase tracking-widest text-[10px] shadow-[6px_6px_0_#000] ${
            certificate.status === 'pending' ? 'bg-yellow-400' :
            certificate.status === 'approved' ? 'bg-green-400' :
            'bg-red-500 text-white'
          }`}>
            Registry Status: {certificate.status}
          </div>
        </div>

        {/* 3-BOX BENTO GRID */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 pb-6">
          
          {/* BOX 1: ARTIFACT VIEWER (LEFT) */}
          <div className="lg:col-span-8 flex flex-col bg-white border-4 border-bg-dark rounded-[2.5rem] shadow-[12px_12px_0_#000] overflow-hidden">
            <div className="px-6 py-4 bg-bg-dark border-b-4 border-bg-dark flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-accent" strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Vault Asset // {certificate.id.substring(0, 8)}</span>
              </div>
              <a 
                href={previewUrl || '#'} 
                target="_blank" 
                className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
              >
                Inspect Raw File
              </a>
            </div>
            <div className="flex-1 bg-zinc-50 relative flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03]" />
              {isLoadingPreview ? (
                <Loader2 className="w-10 h-10 animate-spin text-bg-dark" />
              ) : previewUrl ? (
                <div className="w-full h-full border-4 border-bg-dark shadow-[15px_15px_0_rgba(0,0,0,0.05)] rounded-2xl overflow-hidden bg-white">
                  {certificate.telegram_file_id.toLowerCase().includes('img') || certificate.telegram_file_id.toLowerCase().includes('jpg') || certificate.telegram_file_id.toLowerCase().includes('png') ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF" />
                  )}
                </div>
              ) : (
                <ShieldAlert className="w-12 h-12 text-zinc-300" />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SPLIT INTO BOX 2 AND BOX 3 */}
          <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
            
            {/* BOX 2: AI REVIEW (TOP RIGHT) */}
            <div className="flex-1 bg-bg-dark border-4 border-bg-dark rounded-[2.5rem] shadow-[12px_12px_0_var(--color-accent)] p-6 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-accent fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Verdict</span>
                </div>
                <div className="text-2xl font-black italic text-accent leading-none">
                  {certificate.score || 0}<span className="text-[10px] not-italic text-zinc-500 ml-1">/50</span>
                </div>
              </div>

              <div className="flex-1 bg-zinc-900/50 border-2 border-white/10 rounded-2xl p-4 mb-4 overflow-y-auto custom-scrollbar">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block mb-2">Cognitive Analysis</span>
                <p className="text-[10px] text-zinc-300 font-bold leading-relaxed italic">
                  "{certificate.extracted_text?.authenticity_reasoning || "Initiating scan..."}"
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2 border-2 border-white/5">
                  <span className="text-[9px] font-black uppercase text-zinc-500">Manual Bias</span>
                  <input 
                    type="number" 
                    value={overrideScore}
                    onChange={(e) => setOverrideScore(parseInt(e.target.value) || 0)}
                    className="w-12 bg-transparent text-white font-black text-right text-xs outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleAudit("approved")}
                    className="bg-[#70e2a4] border-2 border-bg-dark rounded-xl py-3 text-[9px] font-black uppercase tracking-widest shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleAudit("rejected")}
                    className="bg-white border-2 border-bg-dark rounded-xl py-3 text-[9px] font-black uppercase tracking-widest shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>

            {/* BOX 3: STUDENT DETAILS (BOTTOM RIGHT) */}
            <div className="flex-1 bg-white border-4 border-bg-dark rounded-[2.5rem] shadow-[12px_12px_0_#000] p-6 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-zinc-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-bg-dark" strokeWidth={3} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-bg-dark">Registry Vault</span>
                </div>
                <button onClick={handleRefresh} className={isRefreshing ? 'animate-spin' : ''}>
                  <RefreshCcw className="w-3 h-3 text-zinc-400" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-4 p-3 bg-zinc-50 border-2 border-bg-dark rounded-2xl">
                  <div className="w-10 h-10 bg-white border-2 border-bg-dark rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-bg-dark" strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-bg-dark uppercase truncate">{certificate.profiles?.username}</div>
                    <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{certificate.profiles?.full_name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-3 border-2 border-bg-dark rounded-xl flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-zinc-400">Section</span>
                    <span className="text-[9px] font-black text-bg-dark uppercase">{certificate.profiles?.section}</span>
                  </div>
                  <div className="p-3 border-2 border-bg-dark rounded-xl flex justify-between items-center bg-accent/5">
                    <span className="text-[8px] font-black uppercase text-zinc-400">Issuer</span>
                    <span className="text-[9px] font-black text-bg-dark uppercase truncate ml-4">{certificate.issuer}</span>
                  </div>
                </div>

                {certificate.extracted_text?.name_mismatch_flag && (
                  <div className="bg-red-500 border-2 border-bg-dark rounded-xl p-3 flex gap-2">
                    <ShieldAlert className="w-4 h-4 text-white shrink-0" strokeWidth={3} />
                    <p className="text-[8px] font-black text-white uppercase leading-tight">
                      Mismatch: Issued to {certificate.extracted_text?.recipient_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
