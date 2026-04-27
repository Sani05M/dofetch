"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { 
  X, 
  Download, 
  ShieldCheck, 
  Zap, 
  Building2, 
  Calendar, 
  User,
  CheckCircle2,
  Loader2,
  FileText,
  ShieldAlert,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Certificate } from "./CertificateCard";

interface CertificatePreviewProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

const AsciiOverlay = () => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.03] font-mono text-[6px] leading-[6px] overflow-hidden select-none z-0">
    {Array.from({ length: 50 }).map((_, i) => (
      <div key={i} className="whitespace-nowrap">
        {Array.from({ length: 100 }).map(() => Math.random() > 0.5 ? "1" : "0").join("")}
      </div>
    ))}
  </div>
);

const ScanningOverlay = () => (
  <div className="absolute inset-0 z-50 overflow-hidden bg-bg-dark/60 pointer-events-none flex flex-col">
    <div className="absolute inset-0 opacity-40 font-mono text-[5px] leading-[5px] overflow-hidden select-none whitespace-pre break-all p-2">
      {Array.from({ length: 120 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 1 + Math.random() * 2, repeat: Infinity }}
          className="text-accent/80"
        >
          {Array.from({ length: 200 }).map(() => "!@#$%^&*()_+-=[]{}|;:,.<>?/\\1234567890".charAt(Math.floor(Math.random() * 40))).join("")}
        </motion.div>
      ))}
    </div>
    <motion.div 
      initial={{ top: "-10%" }}
      animate={{ top: "110%" }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className="absolute left-0 right-0 h-2 bg-accent shadow-[0_0_30px_#70e2a4,0_0_60px_#70e2a4] z-50"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />
  </div>
);

export function CertificatePreview({ certificate, isOpen, onClose, onDelete }: CertificatePreviewProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasVerified, setHasVerified] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const [verificationReason, setVerificationReason] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && certificate) {
      setHasVerified(certificate.status === 'approved');
      // @ts-ignore - extracted_text is JSONB
      if (certificate.extractedText?.ai_reasoning) {
        setVerificationReason(certificate.extractedText.ai_reasoning);
      }
    }
  }, [isOpen, certificate]);

  const runRealVerification = async () => {
    if (!certificate || hasVerified) return;
    
    setIsVerifying(true);
    try {
      const res = await fetch(`/api/verify/${certificate.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: certificate.studentName,
          fileId: certificate.fileId
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown server error" }));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }
      
      const result = await res.json();
      if (result.isAuthentic) {
        setHasVerified(true);
        setVerificationReason(result.reasoning);
      } else {
        alert(`Verification Result: Not Authentic\nReason: ${result.reasoning}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Verification Error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen && certificate?.fileId) {
      loadPreview();
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setIsFlipped(false);
      setVerificationReason(null);
    };
  }, [isOpen, certificate?.fileId]);

  const loadPreview = async () => {
    if (!certificate?.fileId) return;
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`/api/view/${certificate.fileId}`);
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

  const handleDelete = async () => {
    if (!certificate || !window.confirm("ARE YOU SURE? THIS WILL PERMANENTLY PURGE THE ARTIFACT FROM THE UNIVERSITY REGISTRY.")) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/certificates/${certificate.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.();
        onClose();
      } else {
        alert("Failed to purge artifact.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // 3D Motion Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 30 });
  const glareOpacity = useSpring(useTransform(x, [-0.5, 0.5], [0.3, 0.6]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isFlipped) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  if (!certificate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg-dark/80 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-7xl bg-bg-surface border-4 border-bg-dark shadow-[24px_24px_0_#000] relative z-10 flex flex-col overflow-hidden rounded-[2.5rem] h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Actions Bar */}
            <div className="px-8 py-5 bg-bg-dark flex items-center justify-between z-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-bg-dark border-2 border-bg-dark">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-accent/60 leading-none mb-1">REGISTRY ARTIFACT</span>
                  <span className="block text-xs font-black uppercase tracking-widest text-white leading-none">#{certificate.id.slice(0,12)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <button 
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="px-6 py-2 bg-bg-surface border-2 border-bg-dark rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_#000] hover:bg-accent transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                >
                  <RefreshCw className={`w-3 h-3 ${isFlipped ? 'rotate-180' : ''} transition-transform duration-500`} />
                  {isFlipped ? 'Show Card' : 'Show Artifact'}
                </button>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2.5 bg-bg-surface border-2 border-bg-dark rounded-xl shadow-[4px_4px_0_#000] hover:bg-accent transition-colors active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative no-scrollbar">
              
              {/* FLIPPABLE PANE */}
              <div 
                className="w-full lg:flex-1 bg-zinc-950 flex items-center justify-center border-b-4 lg:border-b-0 lg:border-r-4 border-bg-dark relative overflow-hidden group perspective-2000 min-h-[400px] lg:min-h-0"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { x.set(0); y.set(0); }}
              >
                <motion.div
                  className="w-full h-full relative"
                  initial={false}
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {isVerifying && <ScanningOverlay />}
                  {/* FRONT: 3D CARD */}
                  <motion.div
                    className="absolute inset-0 w-full h-full backface-hidden flex items-center justify-center p-6 lg:p-10"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-accent blur-[150px]" />
                      <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-accent blur-[150px]" />
                    </div>

                    <motion.div 
                      style={{ 
                        rotateX: isMobile ? 0 : rotateX, 
                        rotateY: isMobile ? 0 : rotateY, 
                        transformStyle: "preserve-3d" 
                      }}
                      className="w-full max-w-[480px] aspect-[1.586/1] bg-gradient-to-br from-zinc-900 via-bg-dark to-zinc-950 rounded-[1.5rem] lg:rounded-[2rem] p-6 lg:p-12 border-4 border-zinc-800 flex flex-col justify-between relative overflow-hidden shadow-[20px_20px_0_#000] lg:shadow-[32px_32px_0_#000]"
                    >
                      {/* Glass Shine */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none" />
                      
                      {/* Top Right Glow */}
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/20 blur-[80px] rounded-full pointer-events-none" />

                      {!isMobile && (
                        <motion.div 
                          style={{ left: glareX, top: glareY, opacity: glareOpacity }}
                          className="absolute w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-white/20 to-transparent blur-3xl pointer-events-none z-10"
                        />
                      )}
                      <AsciiOverlay />
                      <div className="flex justify-between items-start relative z-20 w-full" style={{ transform: "translateZ(40px)" }}>
                        <div className="flex items-center gap-3 lg:gap-4">
                          <div className="w-10 h-10 lg:w-14 lg:h-14 bg-accent rounded-xl lg:rounded-2xl flex items-center justify-center transform rotate-12 border-2 border-bg-dark shadow-2xl">
                            <Zap className="w-5 h-5 lg:w-7 lg:h-7 text-bg-dark fill-current" />
                          </div>
                          <div>
                            <div className="text-[6px] lg:text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-0.5 lg:mb-1">OFFICIAL ISSUER</div>
                            <div className="text-[10px] lg:text-xs font-black text-white uppercase leading-tight tracking-tight">{certificate.issuer}</div>
                          </div>
                        </div>
                      </div>
                      <div className="relative z-20" style={{ transform: "translateZ(60px)" }}>
                        <div className="text-[6px] lg:text-[8px] font-black uppercase tracking-[0.5em] text-accent/60 mb-1 lg:mb-2">CREDENTIAL ARTIFACT</div>
                        <h3 className="text-xl lg:text-3xl font-black uppercase tracking-tighter leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                          {certificate.title}
                        </h3>
                      </div>
                      <div className="flex justify-between items-end relative z-20" style={{ transform: "translateZ(50px)" }}>
                        <div>
                          <div className="text-[6px] lg:text-[8px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-1">HOLDER</div>
                          <div className="text-sm lg:text-lg font-black uppercase tracking-tight text-white leading-none">
                            {certificate.studentName}
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-[10px] lg:text-sm font-black text-white tabular-nums tracking-tighter">{certificate.issueDate}</div>
                           <div className="mt-1 lg:mt-2 inline-flex items-center px-1.5 lg:px-2 py-0.5 bg-accent text-bg-dark rounded-lg text-[6px] lg:text-[8px] font-black uppercase tracking-widest border border-bg-dark/20">
                              AUTHENTIC
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* BACK: PDF PREVIEW */}
                  <motion.div
                    className="absolute inset-0 w-full h-full bg-zinc-900 flex items-center justify-center p-4 lg:p-10"
                    style={{ 
                      backfaceVisibility: "hidden",
                      rotateY: 180
                    }}
                  >
                    <div className="w-full h-full rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border-4 border-bg-dark shadow-2xl bg-white relative">
                      {isLoadingPreview ? (
                        <div className="flex flex-col items-center justify-center h-full gap-6 bg-zinc-900">
                          <div className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-zinc-700 border-t-accent rounded-full animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Decrypting Artifact...</p>
                        </div>
                      ) : previewUrl ? (
                        certificate.fileType === 'IMG' ? (
                          <img src={previewUrl} alt="Source" className="w-full h-full object-contain" />
                        ) : (
                          <iframe 
                            src={`${previewUrl}#toolbar=0&navpanes=0`} 
                            className="w-full h-full border-none" 
                            title="Secure Document"
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full bg-zinc-900">
                          <ShieldAlert className="w-12 h-12 lg:w-16 lg:h-16 text-zinc-700 mb-6" />
                          <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px] lg:text-xs">Integrity Check Failed</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* RIGHT: METADATA & ACTIONS */}
              <div className="w-full lg:flex-[0.8] bg-white p-6 lg:p-12 flex flex-col justify-between">
                <div className="space-y-8 lg:space-y-12">
                   <div className="flex items-center gap-4 p-4 bg-bg-base border-2 border-bg-dark rounded-2xl shadow-[4px_4px_0_#000]">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-bg-dark rounded-xl flex items-center justify-center text-accent">
                      <Zap className="w-5 h-5 lg:w-6 lg:h-6 fill-current" />
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-0.5">STATUS</span>
                      <span className="block text-[10px] lg:text-xs font-black uppercase tracking-widest text-bg-dark">REGISTRY VALIDATED</span>
                    </div>
                  </div>

                  <div className="space-y-6 lg:space-y-10">
                    <div className="flex items-start gap-4 lg:gap-5">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Building2 className="w-5 h-5 lg:w-6 lg:h-6 text-zinc-400" />
                      </div>
                      <div>
                        <div className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">ISSUER INSTITUTION</div>
                        <div className="font-black text-xs lg:text-sm uppercase tracking-tight text-bg-dark">{certificate.issuer}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 lg:gap-5">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-zinc-400" />
                      </div>
                      <div>
                        <div className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">ISSUANCE DATE</div>
                        <div className="font-black text-xs lg:text-sm uppercase tracking-tight text-bg-dark">{certificate.issueDate}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 lg:gap-5">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-zinc-50 border-2 border-zinc-100 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="w-5 h-5 lg:w-6 lg:h-6 text-zinc-400" />
                      </div>
                      <div>
                        <div className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">CREDENTIAL HOLDER</div>
                        <div className="font-black text-xs lg:text-sm uppercase tracking-tight text-bg-dark">{certificate.studentName}</div>
                      </div>
                    </div>

                    {verificationReason && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-accent/10 border-2 border-accent/20 rounded-2xl"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-4 h-4 text-accent" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-accent">Verification Context</span>
                        </div>
                        <p className="text-[10px] font-medium text-bg-dark/70 leading-relaxed italic">
                          "{verificationReason}"
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-8 lg:pt-12">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <a 
                        href={previewUrl || "#"} 
                        download={`${certificate.title.replace(/\s+/g, '_')}.pdf`}
                        className="btn-primary py-4 lg:py-5 text-[10px] flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl shadow-[4px_4px_0_#000] lg:shadow-[6px_6px_0_#000]"
                      >
                        <Download className="w-4 h-4 lg:w-5 lg:h-5" />
                        DOWNLOAD PDF
                      </a>
                      <button 
                        className={`btn-secondary py-4 lg:py-5 text-[10px] flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl border-4 shadow-[4px_4px_0_#000] lg:shadow-[6px_6px_0_#000] ${hasVerified ? 'bg-[#70e2a4] text-bg-dark border-bg-dark' : ''}`}
                        onClick={() => !hasVerified && runRealVerification()}
                      >
                        {isVerifying ? <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" /> : hasVerified ? <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" /> : <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5" />}
                        {hasVerified ? 'AUTHENTIC' : 'VERIFY AUTHENTICITY'}
                      </button>
                   </div>
                   
                   <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                   >
                     {isDeleting ? 'PURGING...' : 'PURGE FROM REGISTRY'}
                   </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
