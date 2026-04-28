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
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/faculty/certificates" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-bg-dark border-b-2 border-transparent hover:border-bg-dark pb-0.5 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </Link>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold border-2 ${
            certificate.status === 'pending' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
            certificate.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
            'bg-red-100 border-red-500 text-red-700'
          }`}>
            <ShieldAlert className="w-3 h-3" />
            <span className="uppercase">{certificate.status}</span>
          </div>
        </div>

        <h1 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-none mb-5">
          ARTIFACT <span className="text-accent">#{certificate.id.substring(0, 8)}...</span>
        </h1>

        {/* BENTO GRID: Preview left (big), 2 stacked cards right (compact) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 auto-rows-min">
          
          {/* Document Preview — spans both rows on desktop */}
          <div className="lg:col-span-7 lg:row-span-2 bg-zinc-900 flex flex-col border-4 border-bg-dark overflow-hidden rounded-2xl shadow-[6px_6px_0_#000]">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <div className="relative">
                  <div className="w-14 h-14 border-4 border-accent/20 rounded-full" />
                  <div className="absolute top-0 left-0 w-14 h-14 border-4 border-t-accent rounded-full animate-spin" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-accent animate-pulse">Establishing Secure Stream...</p>
              </div>
            ) : previewUrl ? (
              <>
                {/* Toolbar */}
                <div className="px-4 py-2.5 bg-bg-dark flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-accent rounded-md flex items-center justify-center text-bg-dark">
                      <FileText className="w-3 h-3" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white">Secure Artifact</span>
                  </div>
                  <a 
                    href={previewUrl} 
                    target="_blank" 
                    className="px-2.5 py-1 bg-zinc-800 text-[9px] font-black uppercase tracking-widest text-accent rounded-md border border-zinc-700 hover:bg-accent hover:text-bg-dark transition-all"
                  >
                    Open Full
                  </a>
                </div>
                {/* Preview Area — fits content naturally */}
                <div className="flex-1 bg-zinc-800 flex items-center justify-center overflow-auto p-4">
                  {certificate.telegram_file_id.toLowerCase().includes('img') || certificate.telegram_file_id.toLowerCase().includes('jpg') || certificate.telegram_file_id.toLowerCase().includes('png') ? (
                    <img 
                      src={previewUrl}
                      alt="Audit Preview"
                      className="max-w-full max-h-[65vh] object-contain rounded-xl border-2 border-zinc-700 shadow-lg"
                    />
                  ) : (
                    <iframe 
                      src={`${previewUrl}#toolbar=0&navpanes=0`}
                      className="w-full h-[65vh] border-none rounded-xl"
                      title="Audit PDF Preview"
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-zinc-600 mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-600 leading-none">Artifact Not Found</h2>
                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600/50">Missing media link</p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Card 1 — Metadata (compact) */}
          <div className="lg:col-span-5 bg-white border-4 border-bg-dark p-5 rounded-2xl shadow-[6px_6px_0_#000]">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b-2 border-bg-base">
              <div className="w-8 h-8 bg-bg-base border-2 border-bg-dark rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-bg-dark fill-current" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-tight">Metadata</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Student</div>
                  <div className="font-black text-xs uppercase tracking-tight text-bg-dark truncate">{certificate.profiles?.username || certificate.profiles?.full_name || 'Unknown'}</div>
                  <div className="text-[7px] font-bold text-zinc-400 uppercase">
                    {certificate.profiles?.username && certificate.profiles?.full_name ? `${certificate.profiles.full_name} • ` : ''}
                    {certificate.profiles?.section} • {certificate.profiles?.batch}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Certificate</div>
                  <div className="font-black text-xs uppercase tracking-tight text-bg-dark truncate">{certificate.title}</div>
                  <div className="text-[7px] font-bold text-zinc-400 uppercase">By {certificate.issuer || 'Unknown'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Issued</div>
                  <div className="font-black text-xs uppercase tracking-tight text-bg-dark">{certificate.issue_date || '—'}</div>
                </div>
              </div>

              {/* Name Mismatch Alert */}
              {certificate.extracted_text?.name_mismatch_flag && (
                <div className="mt-2 bg-red-50 border-2 border-red-300 rounded-xl p-3 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-red-600">Identity Mismatch</div>
                    <div className="text-[10px] font-bold text-red-700 leading-tight mt-0.5">
                      Certificate issued to: <span className="font-black">{certificate.extracted_text?.recipient_name || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Card 2 — AI Assessment + Actions (compact) */}
          <div className="lg:col-span-5 bg-zinc-900 border-4 border-bg-dark p-5 rounded-2xl shadow-[6px_6px_0_#000] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-accent" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Assessment</h3>
              </div>
              <div className={`px-2.5 py-0.5 rounded-md border-2 text-[10px] font-black ${
                (certificate.score || 0) >= 35 ? 'bg-green-500/20 text-green-400 border-green-500/50' : 
                (certificate.score || 0) >= 20 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 
                'bg-red-500/20 text-red-400 border-red-500/50'
              }`}>
                {certificate.score || 0}/50
              </div>
            </div>
            
            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed bg-black/40 p-3 rounded-xl border border-zinc-800 max-h-32 overflow-y-auto">
              {certificate.extracted_text?.authenticity_reasoning || "No AI reasoning provided for this artifact."}
            </p>

            {/* Score Override */}
            <div className="flex items-center gap-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 whitespace-nowrap">Override</label>
              <input 
                type="number" 
                max={50} 
                min={0}
                value={overrideScore}
                onChange={(e) => setOverrideScore(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                className="flex-1 bg-black/40 border-2 border-zinc-700 rounded-lg px-3 py-2 text-white font-bold text-xs focus:border-accent outline-none transition-colors"
              />
              <span className="text-zinc-600 text-[9px] font-bold">/50</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button 
                onClick={() => handleAudit("approved")}
                disabled={isProcessing}
                className="bg-[#70e2a4] hover:bg-[#5cd091] text-bg-dark font-black uppercase tracking-widest text-[10px] py-3 rounded-xl border-3 border-bg-dark shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Verify
              </button>
              
              <button 
                onClick={() => handleAudit("rejected")}
                disabled={isProcessing}
                className="bg-white hover:bg-zinc-50 text-red-500 font-black uppercase tracking-widest text-[10px] py-3 rounded-xl border-3 border-bg-dark shadow-[4px_4px_0_#000] flex items-center justify-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
