"use client";

import React, { useState, useEffect, use } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  User,
  Calendar,
  Loader2,
  Zap
} from "lucide-react";

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
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

  useEffect(() => {
    async function fetchCert() {
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("*, profiles(*)")
          .eq("id", certId)
          .single();

        if (error) throw error;
        setCertificate(data);
      } catch (err) {
        console.error("Error fetching certificate:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCert();
  }, [certId]);

  const handleAudit = async (status: "approved" | "rejected") => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("certificates")
        .update({ status })
        .eq("id", certId);

      if (error) throw error;
      router.push("/faculty/certificates");
    } catch (err) {
      console.error("Audit update failed:", err);
      alert("Failed to update status.");
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
      <div className="max-w-6xl mx-auto px-4 md:px-0">
        <Link href="/faculty/certificates" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-500 hover:text-bg-dark mb-8 border-b-2 border-transparent hover:border-bg-dark pb-1 transition-all">
          <ArrowLeft className="w-4 h-4" />
          Back to Queue
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-4 md:gap-8">
          <div>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border-2 mb-4 ${
              certificate.status === 'pending' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' :
              certificate.status === 'approved' ? 'bg-green-100 border-green-500 text-green-700' :
              'bg-red-100 border-red-500 text-red-700'
            }`}>
              <ShieldAlert className="w-3 h-3" />
              <span className="uppercase">{certificate.status} AUDIT</span>
            </div>
            <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85] break-words">
              ARTIFACT<br/>
              <span className="text-accent">#{certificate.id.substring(0, 8)}...</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview Panel - REFINED BENTO DESIGN */}
          <div className="lg:col-span-2 bg-zinc-900 flex flex-col items-center justify-center min-h-[400px] md:min-h-[650px] border-4 border-bg-dark overflow-hidden relative rounded-[2rem] md:rounded-[2.5rem] shadow-[8px_8px_0_#000] md:shadow-[12px_12px_0_#000]">
            {isLoadingPreview ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-accent/20 rounded-full" />
                  <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-accent rounded-full animate-spin" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-accent animate-pulse">Establishing Secure Stream...</p>
              </div>
            ) : previewUrl ? (
              <div className="w-full h-full relative z-20 flex flex-col">
                <div className="px-6 py-4 bg-bg-dark flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-accent rounded-lg flex items-center justify-center text-bg-dark">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">SECURE AUDIT ARTIFACT</span>
                  </div>
                  <a 
                    href={previewUrl} 
                    target="_blank" 
                    className="px-3 py-1 bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-accent rounded-lg border-2 border-zinc-700 hover:bg-accent hover:text-bg-dark transition-all"
                  >
                    Open Full Artifact
                  </a>
                </div>
                <div className="flex-1 w-full bg-zinc-800 flex items-center justify-center overflow-hidden p-6">
                  <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-bg-dark shadow-2xl bg-white">
                    {certificate.telegram_file_id.toLowerCase().includes('img') || certificate.telegram_file_id.toLowerCase().includes('jpg') || certificate.telegram_file_id.toLowerCase().includes('png') ? (
                      <img 
                        src={previewUrl}
                        alt="Audit Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <iframe 
                        src={`${previewUrl}#toolbar=0&navpanes=0`}
                        className="w-full h-full border-none"
                        title="Audit PDF Preview"
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center p-12 text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-zinc-600 mb-8 shadow-xl">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-zinc-600 leading-none">ARTIFACT NOT<br/>FOUND</h2>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 opacity-50">REGISTRY RECORD MISSING MEDIA LINK</p>
              </div>
            )}
          </div>

          {/* Metadata & Actions Panel - REFINED BENTO DESIGN */}
          <div className="space-y-8 flex flex-col">
            <div className="bg-white border-4 border-bg-dark p-8 md:p-10 rounded-[2.5rem] shadow-[12px_12px_0_#000] flex-1">
              <div className="flex items-center gap-3 mb-8 pb-8 border-b-2 border-bg-base">
                <div className="w-10 h-10 bg-bg-base border-2 border-bg-dark rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-bg-dark fill-current" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">METADATA</h2>
              </div>
              
              <div className="space-y-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-zinc-50 border-2 border-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">STUDENT NAME</div>
                    <div className="font-black text-sm uppercase tracking-tight text-bg-dark">{certificate.profiles?.full_name || 'Abhishek Singh'}</div>
                    <div className="text-[8px] font-bold text-zinc-400 uppercase mt-1">{certificate.profiles?.section} • BATCH {certificate.profiles?.batch}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-zinc-50 border-2 border-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">CERTIFICATE</div>
                    <div className="font-black text-sm uppercase tracking-tight text-bg-dark">{certificate.title}</div>
                    <div className="text-[8px] font-bold text-zinc-400 uppercase mt-1">ISSUED BY {certificate.issuer || 'UNKNOWN'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-zinc-50 border-2 border-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">DATE ISSUED</div>
                    <div className="font-black text-sm uppercase tracking-tight text-bg-dark">{certificate.issue_date || '2026-04-27'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => handleAudit("approved")}
                disabled={isProcessing}
                className="w-full bg-[#70e2a4] hover:bg-[#5cd091] text-bg-dark font-black uppercase tracking-widest text-xs py-5 rounded-2xl border-4 border-bg-dark shadow-[6px_6px_0_#000] flex items-center justify-center gap-3 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                VERIFY ARTIFACT
              </button>
              
              <button 
                onClick={() => handleAudit("rejected")}
                disabled={isProcessing}
                className="w-full bg-white hover:bg-zinc-50 text-red-500 font-black uppercase tracking-widest text-xs py-5 rounded-2xl border-4 border-bg-dark shadow-[6px_6px_0_#000] flex items-center justify-center gap-3 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                REJECT ARTIFACT
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
