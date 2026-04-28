"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomSelect } from "@/components/CustomSelect";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { useCertificates } from "@/hooks/useCertificates";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Zap, CheckCircle2, Loader2, FileText, ArrowRight, AlertTriangle, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function StudentUpload() {
  const { addCertificate } = useCertificates();
  const { user } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stagedPath, setStagedPath] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<{show: boolean, title: string, message: string, type: 'error' | 'warning'}>({
    show: false,
    title: '',
    message: '',
    type: 'error'
  });
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    issuer: "",
    type: "Academic Artifact",
    issueDate: new Date().toISOString().split("T")[0],
  });

  const resetForm = () => {
    setSelectedFile(null);
    setStagedPath(null);
    setFormData({ title: "", issuer: "", type: "Academic Artifact", issueDate: new Date().toISOString().split("T")[0] });
    setExtractedAiData({ score: 0, reasoning: "", fileHash: "", verificationLink: "", recipientName: "", nameMatch: true, nameMismatchFlag: false });
    localStorage.removeItem("upload_form_data");
    localStorage.removeItem("extracted_ai_data");
    fetch("/api/upload/status", { method: "DELETE" }).catch(() => {});
  };

  const [quota, setQuota] = useState({ used: 0, limit: 10, resetAt: "" });
  const [loadingQuota, setLoadingQuota] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/quota");
        if (res.ok) {
          const data = await res.json();
          setQuota({ used: data.used, limit: data.limit, resetAt: data.reset_at });
        }
      } catch (err) {
        console.error("Failed to fetch quota");
      } finally {
        setLoadingQuota(false);
      }
    };
    fetchQuota();
  }, []);

  useEffect(() => {
    const checkActiveTasks = async () => {
      try {
        const res = await fetch("/api/upload/status");
        if (res.ok) {
          const data = await res.json();
          // If we were synchronizing, restore the full-screen loader
          if (data.status === "synchronizing") {
            setIsUploading(true);
            const poll = setInterval(async () => {
              const r = await fetch("/api/upload/status");
              const d = await r.json();
              if (d.status === "idle" || !d.status) {
                localStorage.removeItem("upload_form_data");
                localStorage.removeItem("extracted_ai_data");
                clearInterval(poll);
                router.push("/student/dashboard");
              }
            }, 2000);
          } 
          // If we were extracting, start polling for results
          else if (data.status === "extracting") {
            setIsExtracting(true);
            const poll = setInterval(async () => {
              const r = await fetch("/api/upload/status");
              const d = await r.json();
              
              if (d.status === "completed" && d.result) {
                const aiData = d.result;
                const newFormData = {
                  title: aiData.title || "",
                  issuer: aiData.issuer || "",
                  type: aiData.type === 'Professional Cert' || aiData.type === 'Academic Artifact' ? aiData.type : 'Academic Artifact',
                  issueDate: aiData.issue_date || new Date().toISOString().split("T")[0],
                };
                const newAiData = {
                  score: aiData.score || 0,
                  reasoning: aiData.authenticity_reasoning || "No reasoning provided",
                  fileHash: aiData.file_hash || "",
                  verificationLink: aiData.extracted_verification_link || "",
                  recipientName: aiData.recipient_name || "",
                  nameMatch: aiData.name_match ?? true,
                  nameMismatchFlag: aiData.name_mismatch_flag ?? false,
                };
                
                setFormData(newFormData);
                setExtractedAiData(newAiData);
                if (d.staged_path) setStagedPath(d.staged_path);
                
                localStorage.setItem("upload_form_data", JSON.stringify(newFormData));
                localStorage.setItem("extracted_ai_data", JSON.stringify(newAiData));
                
                setIsExtracting(false);
                clearInterval(poll);
              } else if (!d.status || d.status === "idle") {
                setIsExtracting(false);
                clearInterval(poll);
              }
            }, 3000);

            // Safety timeout
            setTimeout(() => { clearInterval(poll); }, 60000);
          }
        }
      } catch (e) {
        console.error("Task check failed", e);
      }
    };
    checkActiveTasks();

    // Load persisted form data
    const savedForm = localStorage.getItem("upload_form_data");
    const savedAi = localStorage.getItem("extracted_ai_data");
    if (savedForm) setFormData(JSON.parse(savedForm));
    if (savedAi) setExtractedAiData(JSON.parse(savedAi));

    // If we have saved data but no file/stagedPath, we should check status again to see if we can get the stagedPath
    const fetchStatus = async () => {
      const res = await fetch("/api/upload/status");
      const d = await res.json();
      if (d.staged_path) setStagedPath(d.staged_path);
    };
    if (savedForm && !selectedFile && !stagedPath) fetchStatus();

    if (!quota.resetAt) return;
    const interval = setInterval(() => {
      const now = new Date();
      const reset = new Date(quota.resetAt);
      const diff = reset.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("0h 0m");
        clearInterval(interval);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${mins}m`);
    }, 1000);
    return () => clearInterval(interval);
  }, [quota.resetAt]);

  const isQuotaReached = quota.used >= quota.limit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !stagedPath) return;
    
    setIsUploading(true);
    
    try {
      const payload = new FormData();
      if (selectedFile) {
        payload.append("file", selectedFile);
      }
      if (stagedPath) {
        payload.append("staged_path", stagedPath);
      }
      
      payload.append("title", formData.title);
      payload.append("type", formData.type);
      payload.append("issuer", formData.issuer);
      payload.append("issue_date", formData.issueDate);
      payload.append("score", extractedAiData.score.toString());
      payload.append("authenticity_reasoning", extractedAiData.reasoning);
      if (extractedAiData.fileHash) {
        payload.append("file_hash", extractedAiData.fileHash);
      }
      if (extractedAiData.verificationLink) {
        payload.append("verification_link", extractedAiData.verificationLink);
      }
      if (extractedAiData.recipientName) {
        payload.append("recipient_name", extractedAiData.recipientName);
      }
      payload.append("name_match", extractedAiData.nameMatch.toString());
      payload.append("name_mismatch_flag", extractedAiData.nameMismatchFlag.toString());

      const res = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to synchronize with mesh");
      }

      localStorage.removeItem("upload_form_data");
      localStorage.removeItem("extracted_ai_data");
      router.push("/student/dashboard");
    } catch (error: any) {
      setCustomAlert({
        show: true,
        title: "Synchronization Error",
        message: error.message,
        type: 'error'
      });
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedAiData, setExtractedAiData] = useState({ score: 0, reasoning: "", fileHash: "", verificationLink: "", recipientName: "", nameMatch: true, nameMismatchFlag: false });

  const handleExtraction = async (file: File) => {
    if (isQuotaReached) {
      setCustomAlert({
        show: true,
        title: "Daily Limit Reached",
        message: `You have reached your daily limit of ${quota.limit} uploads. Please try again tomorrow.`,
        type: 'warning'
      });
      return;
    }

    setSelectedFile(file);
    setStagedPath(null);
    setIsExtracting(true);
    try {
      const payload = new FormData();
      payload.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: payload });
      
      if (!res.ok) {
        const error = await res.json();
        setCustomAlert({
          show: true,
          title: "Extraction Failed",
          message: error.error || "Failed to analyze artifact",
          type: 'error'
        });
        setSelectedFile(null);
        setIsExtracting(false);
        return;
      }

      const { data } = await res.json();
      const newFormData = {
        title: data.title || "",
        issuer: data.issuer || "",
        type: data.type === 'Professional Cert' || data.type === 'Academic Artifact' ? data.type : 'Academic Artifact',
        issueDate: data.issue_date || new Date().toISOString().split("T")[0],
      };
      const newAiData = {
        score: data.score || 0,
        reasoning: data.authenticity_reasoning || "No reasoning provided",
        fileHash: data.file_hash || "",
        verificationLink: data.extracted_verification_link || "",
        recipientName: data.recipient_name || "",
        nameMatch: data.name_match ?? true,
        nameMismatchFlag: data.name_mismatch_flag ?? false,
      };

      setFormData(newFormData);
      setExtractedAiData(newAiData);

      // Persist to localStorage
      localStorage.setItem("upload_form_data", JSON.stringify(newFormData));
      localStorage.setItem("extracted_ai_data", JSON.stringify(newAiData));

      // Show warning if name doesn't match
      if (data.name_mismatch_flag) {
        setCustomAlert({
          show: true,
          title: "Identity Mismatch",
          message: `The certificate appears to be issued to "${data.recipient_name}" — not your registered name. Score has been penalized. If this is correct, you may still proceed.`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error("Extraction failed", error);
      setSelectedFile(null);
    } finally {
      setIsExtracting(false);
      // Clear extraction status from Redis if we finish (success or error)
      fetch("/api/upload/status", { method: "DELETE" }).catch(() => {});
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExtraction(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleExtraction(e.target.files[0]);
    }
  };

  return (
    <DashboardLayout allowedRole="student">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#000]">
            <Upload className="w-6 h-6 text-bg-dark" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Sync Artifact</h1>
            <p className="text-text-secondary font-bold text-[10px] md:text-xs uppercase tracking-widest">Connect your credential to the institutional mesh</p>
          </div>
        </div>

        {/* Daily Quota Tracker */}
        {!loadingQuota && (
          <div className="mb-8 p-4 md:p-6 bg-bg-surface rounded-2xl border-2 border-border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-2 mb-3">
              <div>
                <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Daily Upload Quota</div>
                <div className="text-xl md:text-2xl font-black uppercase text-text-primary tracking-tighter">
                  {quota.used} <span className="text-text-secondary text-sm md:text-lg">/ {quota.limit} USED</span>
                </div>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded-md">
                Resets in {timeLeft || "..."}
              </div>
            </div>
            <div className="w-full bg-bg-dark rounded-full h-3 overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-1000 ${isQuotaReached ? 'bg-red-500' : 'bg-accent'}`}
                style={{ width: `${Math.min(100, (quota.used / quota.limit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* LEFT COLUMN: Payload */}
          <div className="space-y-6">
            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Secure Payload (PDF/IMG)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                h-64 md:h-full min-h-[400px] border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all gap-4
                ${isDragging ? "border-accent bg-accent/5 scale-[0.98]" : "border-border bg-bg-surface hover:border-text-secondary"}
                ${selectedFile ? "border-green-500 bg-green-500/5" : ""}
                shadow-[4px_4px_0_#000]
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
              />
              
              {isExtracting ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-accent"
                >
                  <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-accent/40"
                      animate={{ y: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <Zap className="w-8 h-8 relative z-10" />
                  </div>
                  <p className="font-black text-sm uppercase tracking-widest text-bg-dark">Scanning Artifact...</p>
                  <p className="text-[10px] text-text-secondary font-bold mt-1 uppercase tracking-widest">Extracting Metadata via AI</p>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExtracting(false);
                      fetch("/api/upload/status", { method: "DELETE" }).catch(() => {});
                    }}
                    className="mt-6 px-4 py-2 bg-bg-surface border-2 border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-colors"
                  >
                    Force Reset
                  </button>
                </motion.div>
              ) : (selectedFile || stagedPath) ? (
                <>
                  <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#166534]">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center px-6">
                    <p className="font-black uppercase tracking-tighter text-text-primary truncate max-w-[200px]">
                      {selectedFile ? selectedFile.name : "Staged Artifact Recovered"}
                    </p>
                    <p className="text-[10px] font-bold text-green-600 uppercase">Payload Ready for Sync</p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetForm();
                      }}
                      className="mt-4 px-3 py-1.5 bg-bg-surface border-2 border-border rounded-lg text-[8px] font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors"
                    >
                      Remove Artifact
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-bg-base border-3 border-border rounded-2xl flex items-center justify-center">
                    <Upload className="w-8 h-8 text-text-secondary" />
                  </div>
                  <div className="text-center px-6">
                    <p className="font-black uppercase tracking-tighter text-text-primary">Drop Artifact or Click</p>
                    <p className="text-[10px] font-bold text-text-secondary uppercase mt-1">Maximum payload size: 10MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Details + Actions */}
          <div className="flex flex-col gap-6">
            <div className="bg-bg-surface border-2 border-border rounded-[2rem] p-6 md:p-8 shadow-[4px_4px_0_#000] space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Artifact Title</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="e.g. AWS Certified Developer"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Issuing Authority</label>
                <input 
                  type="text" 
                  required
                  className="input-field"
                  placeholder="e.g. Amazon Web Services"
                  value={formData.issuer}
                  onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Artifact Type</label>
                  <CustomSelect 
                    options={[
                      { label: 'Academic Artifact', value: 'Academic Artifact' },
                      { label: 'Professional Cert', value: 'Professional Cert' },
                      { label: 'Workshop Token', value: 'Workshop Token' },
                    ]}
                    value={formData.type}
                    onChange={(val) => setFormData({...formData, type: val})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Issue Date</label>
                  <CustomDatePicker 
                    value={formData.issueDate}
                    onChange={(date) => setFormData({...formData, issueDate: date})}
                  />
                </div>
              </div>
            </div>

            {extractedAiData.score > 0 && extractedAiData.score < 25 && (
              <div className="p-4 bg-orange-500/10 border-2 border-orange-500/50 rounded-2xl flex gap-4 items-start">
                <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-1">Verification Warning</h4>
                  <p className="text-[10px] md:text-xs font-bold text-text-secondary leading-relaxed">
                    Our automated system flagged inconsistencies in this artifact. You may proceed, but it has been marked for strict manual review by the faculty.
                  </p>
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={(!selectedFile && !stagedPath) || isUploading || isQuotaReached}
              className={`
                w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs md:text-sm flex items-center justify-center gap-3 transition-all
                ${((!selectedFile && !stagedPath) || isUploading || isQuotaReached)
                  ? "bg-bg-surface border-4 border-border text-text-secondary cursor-not-allowed" 
                  : "bg-bg-dark text-text-on-dark border-4 border-accent shadow-[6px_6px_0_var(--color-accent)] hover:-translate-y-1 hover:shadow-[8px_8px_0_var(--color-accent)] active:translate-x-1 active:translate-y-1 active:shadow-none"
                }
              `}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Initialize Sync
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {isUploading && (
          <div className="fixed inset-0 z-[100] bg-bg-dark/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
            <div className="w-32 h-32 md:w-48 md:h-48 relative mb-8">
              <div className="absolute inset-0 border-8 border-accent/20 rounded-full" />
              <div className="absolute inset-0 border-8 border-accent border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-12 h-12 md:w-20 md:h-20 text-accent animate-pulse fill-current" />
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">MESH SYNCHRONIZATION</h2>
            <p className="text-accent font-black uppercase tracking-widest text-[10px] md:text-sm max-w-md">Distributing encrypted artifact payload across the institutional validation nodes...</p>
          </div>
        )}

        {/* Custom Alert Modal - rendered via portal to escape layout constraints */}
        {typeof window !== 'undefined' && createPortal(
          <AnimatePresence>
            {customAlert.show && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setCustomAlert({...customAlert, show: false})}
                  className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-bg-surface border-4 border-bg-dark shadow-[12px_12px_0_#000] p-8 md:p-10 rounded-[2.5rem] w-full max-w-md relative z-10 text-center"
                >
                  <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_#000] border-4 border-bg-dark",
                    customAlert.type === 'error' ? "bg-red-500" : "bg-accent"
                  )}>
                    {customAlert.type === 'error' ? <ShieldAlert className="w-10 h-10 text-white" /> : <Zap className="w-10 h-10 text-bg-dark" />}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-text-primary mb-2">{customAlert.title}</h3>
                  <p className="text-text-secondary font-bold text-xs uppercase tracking-widest mb-8 leading-relaxed">{customAlert.message}</p>
                  <button 
                    onClick={() => setCustomAlert({...customAlert, show: false})}
                    className="w-full py-4 bg-bg-dark text-white font-black uppercase tracking-widest text-xs rounded-2xl border-4 border-bg-dark hover:bg-zinc-800 transition-colors shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  >
                    Understood
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </DashboardLayout>
  );
}
