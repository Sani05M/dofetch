"use client";

import { useState, useEffect } from "react";
import { Certificate } from "@/components/CertificateCard";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export function useCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCertificates = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let query = supabase.from("certificates").select("*, profiles!inner(*)");

      if (user.role === "student") {
        query = query.eq("student_id", user.id);
      } else if (user.role === "faculty") {
        // Fetch certificates from students in sections managed by this faculty
        // Note: profiles!inner(*) ensures we only get certificates where the student profile matches
        // the filter below
        const sections = user.sectionsManaged || [];
        if (sections.length > 0) {
          query = query.in("profiles.section", sections);
        } else {
          // If faculty manages no sections, show nothing or everything? 
          // Usually better to show nothing to avoid leakage
          setCertificates([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const formattedCerts: Certificate[] = (data || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        studentName: c.profiles?.full_name || "Unknown Scholar",
        studentId: c.student_id,
        section: c.profiles?.section || "N/A",
        batch: c.profiles?.batch || "N/A",
        type: c.type,
        issueDate: c.issue_date,
        rating: c.score ? (c.score > 90 ? "Platinum" : c.score > 75 ? "Gold" : "Silver") : "Pending",
        status: c.status,
        fileType: "PDF",
        fileId: c.telegram_file_id,
        extractedText: c.extracted_text
      }));

      setCertificates(formattedCerts);
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [user?.id]);

  const addCertificate = async (cert: any) => {
    // This is now handled by the /api/upload route
    // But we keep it as a refresh trigger if needed
    await fetchCertificates();
  };

  const updateStatus = async (id: string, status: string, rating?: any) => {
    try {
      const { error } = await supabase
        .from("certificates")
        .update({ status, score: rating })
        .eq("id", id);
      
      if (error) throw error;
      await fetchCertificates();
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  return { certificates, addCertificate, updateStatus, loading, refresh: fetchCertificates };
}
