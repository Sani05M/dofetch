"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { CustomSelect } from "@/components/CustomSelect";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { useCertificates } from "@/hooks/useCertificates";
import { motion } from "framer-motion";
import { Upload, Zap, CheckCircle2, Loader2, FileText, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function StudentUpload() {
  const { addCertificate } = useCertificates();
  const { user } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    issuer: "",
    type: "Academic Artifact",
    issueDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      const payload = new FormData();
      payload.append("file", selectedFile);
      payload.append("title", formData.title);
      payload.append("type", formData.type);
      payload.append("issuer", formData.issuer);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to synchronize with mesh");
      }

      router.push("/student/dashboard");
    } catch (error: any) {
      alert("Synchronization Error: " + error.message);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-6">
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

            <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-6">
            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Secure Payload (PDF/IMG)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                h-64 md:h-full min-h-[300px] border-4 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all gap-4
                ${isDragging ? "border-accent bg-accent/5 scale-[0.98]" : "border-border bg-bg-surface hover:border-text-secondary"}
                ${selectedFile ? "border-green-500 bg-green-500/5" : ""}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
              
              {selectedFile ? (
                <>
                  <div className="w-20 h-20 bg-green-500 rounded-2xl flex items-center justify-center shadow-[4px_4px_0_#166534]">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-black uppercase tracking-tighter text-text-primary truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-[10px] font-bold text-green-600 uppercase">Payload Ready for Sync</p>
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

            <button 
              type="submit"
              disabled={!selectedFile || isUploading}
              className={`
                w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all
                ${!selectedFile || isUploading 
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
      </div>
    </DashboardLayout>
  );
}
