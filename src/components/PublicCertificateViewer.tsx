"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  FileText,
  Download,
  BadgeCheck,
  AlertTriangle,
} from "lucide-react";

interface PublicCertificateViewerProps {
  certificate: any;
}

export function PublicCertificateViewer({
  certificate,
}: PublicCertificateViewerProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  // Use direct API URL for the iframe — avoids cross-origin blob restrictions in Firefox/Safari
  const apiPreviewUrl = certificate?.telegram_file_id
    ? `/api/view/${certificate.telegram_file_id}`
    : null;
  const [imgBlobUrl, setImgBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // For IMG type only: fetch a blob URL (needed for <img> tag to display correctly)
  // For PDF: we stream directly via iframe src pointing to our API route
  useEffect(() => {
    if (certificate?.telegram_file_id && certificate?.type === "IMG") {
      loadImgPreview();
    }
    // Cleanup blob URL on unmount to prevent memory leaks
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [certificate?.telegram_file_id]);

  const loadImgPreview = async () => {
    setIsLoading(true);
    setPreviewError(false);
    try {
      const response = await fetch(`/api/view/${certificate.telegram_file_id}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const blob = await response.blob();
      // Revoke old URL before creating new one
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setImgBlobUrl(url);
    } catch (err) {
      console.error("Preview error:", err);
      setPreviewError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (certificate?.type === "IMG") {
      loadImgPreview();
    } else {
      // For PDF, just reset error state — iframe will reload
      setPreviewError(false);
    }
  };

  const handleDownload = () => {
    if (!apiPreviewUrl) return;
    // Use API URL directly — works for both PDF and IMG without a pre-loaded blob
    const link = document.createElement("a");
    link.href = apiPreviewUrl;
    const ext = certificate.type === "IMG" ? "jpg" : "pdf";
    link.setAttribute(
      "download",
      `${certificate.title.replace(/\s+/g, "_")}.${ext}`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* 3D ARTIFACT VIEWER CARD */}
      <div className="bg-zinc-900/50 backdrop-blur-md rounded-3xl border border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
        {/* Action Bar (Header) */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 bg-black/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              3D Visual Evidence
            </span>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 uppercase hidden sm:block">
            ARTIFACT: {certificate.id.split("-")[0]}
          </div>
        </div>

        {/* FLIP CONTAINER */}
        <div className="p-4 md:p-6 bg-[#09090b]">
          <div className="relative aspect-[4/3] md:aspect-[21/9] lg:max-h-[55vh] w-full perspective-2000 mx-auto">
            <motion.div
              className="w-full h-full relative"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* FRONT: Visual Block with Metadata */}
              <div
                className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center bg-[#09090b] rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden p-6 md:p-8"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-black/80 pointer-events-none" />
                <div className="relative z-10 w-full max-w-3xl text-center flex flex-col justify-between h-full">
                  {/* Top: Branding & Issuer */}
                  <div className="flex flex-col items-center gap-2 md:gap-3 shrink-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-accent/5 rounded-2xl flex items-center justify-center border border-accent/20 shadow-[0_0_30px_rgba(112,226,164,0.1)]">
                      <Zap className="w-6 h-6 md:w-8 md:h-8 text-accent fill-current drop-shadow-[0_0_15px_rgba(112,226,164,0.8)]" />
                    </div>
                    <div>
                      <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-1">
                        ISSUER
                      </div>
                      <div className="text-base md:text-xl font-black text-white uppercase tracking-tighter truncate max-w-full px-4">
                        {certificate.issuer || "Institutional Authority"}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Title */}
                  <div className="flex-1 flex flex-col justify-center py-4 min-h-0">
                    <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500 mb-1 md:mb-2 shrink-0">
                      OFFICIAL CREDENTIAL
                    </div>
                    <h3
                      className={`font-black uppercase tracking-tighter leading-[1] text-white text-balance ${
                        certificate.title.length > 60
                          ? "text-lg md:text-xl lg:text-2xl"
                          : certificate.title.length > 40
                            ? "text-xl md:text-2xl lg:text-3xl"
                            : certificate.title.length > 20
                              ? "text-2xl md:text-3xl lg:text-4xl"
                              : "text-3xl md:text-4xl lg:text-[40px]"
                      }`}
                    >
                      {certificate.title}
                    </h3>
                  </div>

                  {/* Bottom: Holder, Date, Status */}
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 pt-4 border-t border-zinc-800/50 text-left w-full mt-auto shrink-0">
                    <div className="text-center md:text-left">
                      <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-0.5">
                        HOLDER
                      </div>
                      <div className="text-base md:text-xl font-black uppercase tracking-tight text-zinc-200 truncate flex items-center gap-2 justify-center md:justify-start">
                        {certificate.profiles?.full_name || "Verified Scholar"}
                        {(certificate.status === "verified" ||
                          certificate.status === "approved") && (
                          <BadgeCheck className="w-5 h-5 text-accent fill-accent/20" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 justify-center md:justify-start">
                        <div className="text-[8px] text-zinc-500 font-mono uppercase truncate">
                          ID:{" "}
                          {certificate.student_id ||
                            certificate.id.split("-")[0]}
                        </div>
                        {certificate.score !== undefined && (
                          <div
                            className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest flex items-center gap-1 ${
                              certificate.score >= 35
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : certificate.score >= 20
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            <ShieldCheck className="w-2.5 h-2.5" />
                            AI SCORE: {certificate.score}/50
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-center md:text-right shrink-0">
                      <div className="text-base md:text-xl font-black text-white tracking-tighter mb-1.5">
                        {certificate.issue_date ||
                          certificate.created_at?.split("T")[0] ||
                          "N/A"}
                      </div>
                      <div
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-zinc-800 shadow-md ${
                          certificate.status === "verified" ||
                          certificate.status === "approved"
                            ? "bg-accent/10 text-accent border-accent/20"
                            : certificate.status === "pending"
                              ? "bg-zinc-800 text-zinc-300"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {certificate.status === "pending"
                          ? "PENDING AUDIT"
                          : certificate.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BACK: PDF/Image Viewer */}
              <div
                className="absolute inset-0 w-full h-full bg-[#09090b] rounded-2xl border border-zinc-700 shadow-2xl overflow-hidden flex items-center justify-center"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-8 h-8 border-2 border-zinc-800 border-t-accent rounded-full animate-spin shadow-[0_0_15px_rgba(112,226,164,0.3)]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">
                      Decrypting Evidence...
                    </p>
                  </div>
                ) : previewError ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
                    <AlertTriangle className="w-10 h-10 text-yellow-500/60" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      Preview Unavailable
                    </p>
                    <p className="text-[9px] text-zinc-700 max-w-[200px]">
                      Could not load artifact from secure storage.
                    </p>
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col md:flex-row">
                    {/* Left: Source Preview */}
                    <div className="flex-1 border-r border-zinc-800 bg-black/40 relative overflow-hidden">
                      {apiPreviewUrl ? (
                        certificate.type === "IMG" ? (
                          // IMG: use blob URL from state (already fetched)
                          imgBlobUrl ? (
                            <img
                              src={imgBlobUrl}
                              alt="Source"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-zinc-700">
                              <FileText className="w-12 h-12 opacity-20" />
                            </div>
                          )
                        ) : (
                          // PDF: point iframe directly at the API route — works in all browsers
                          <iframe
                            src={`${apiPreviewUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full border-none"
                            title="Secure Document"
                          />
                        )
                      ) : (
                        <div className="flex items-center justify-center h-full text-zinc-700">
                          <FileText className="w-12 h-12 opacity-20" />
                        </div>
                      )}
                    </div>
                    {/* Right: Verification QR & Trust Metrics */}
                    <div className="w-full md:w-64 bg-zinc-950 p-6 flex flex-col items-center justify-center text-center gap-4">
                      <div className="p-3 bg-white rounded-xl shadow-lg">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://do-fetch.vercel.app/verify/${certificate.id}`)}&bgcolor=ffffff&color=09090b`}
                          alt="Verification QR"
                          className="w-24 h-24"
                        />
                      </div>
                      <div>
                        <p className="text-accent font-black uppercase tracking-widest text-[8px] mb-1">
                          Verify Authenticity
                        </p>
                        <p className="text-zinc-600 text-[7px] leading-tight uppercase font-mono">
                          Scan for real-time audit record
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-zinc-800 w-full flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[7px] font-mono text-zinc-500 uppercase">
                          <span>Hash Status</span>
                          <span className="text-green-500">MATCHED</span>
                        </div>
                        <div className="flex items-center justify-between text-[7px] font-mono text-zinc-500 uppercase">
                          <span>Mesh Link</span>
                          <span className="text-accent">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex justify-between items-center p-4 border-t border-zinc-800 bg-black/20 gap-4">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:translate-y-[2px] flex items-center justify-center gap-2"
          >
            <RefreshCw
              className={`w-3 h-3 ${isFlipped ? "rotate-180" : ""} text-accent transition-transform duration-500`}
            />
            {isFlipped ? "Hide Details" : "View Artifact"}
          </button>
          <button
            onClick={handleDownload}
            disabled={!apiPreviewUrl}
            className="flex-1 py-3 bg-zinc-900 border border-accent/50 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(112,226,164,0.1)] hover:bg-accent/10 transition-all active:translate-y-[2px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            Download Artifact
          </button>
        </div>
      </div>
    </div>
  );
}
