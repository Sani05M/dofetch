"use client";

import { useState, useEffect, useRef } from "react";
import { Certificate } from "@/components/CertificateCard";
import {
  createClerkSupabaseClient,
  supabase as serviceSupabase,
} from "@/lib/supabase";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { useAuth } from "@/context/AuthContext";

export function useCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  // Track if this is the first fetch so we only show the spinner once
  const initialFetchDone = useRef(false);

  const fetchCertificates = async (showSpinner = false) => {
    if (!user) return;

    if (showSpinner || !initialFetchDone.current) {
      setLoading(true);
    }

    try {
      // Get Clerk token for RLS-authenticated reads
      const token = await getToken({ template: "supabase" });

      let data: any[] | null = null;
      let fetchError: any = null;

      if (token) {
        const authenticatedSupabase = createClerkSupabaseClient(token);
        // Use !inner join when filtering by section to ensure only matching profiles are returned
        // and to fix the 'Unknown Scholar' issue where the join was nullified by the filter.
        let query = authenticatedSupabase
          .from("certificates")
          .select(`*, profiles!inner(*)`);

        if (user.role === "student") {
          query = query.eq("student_id", user.id);
        } else if (user.role === "faculty") {
          const sections = user.sectionsManaged || [];
          if (sections.length > 0) {
            // If "Global" is in the list, we don't apply a section filter (fetch everything)
            if (!sections.includes("Global")) {
              // Apply filter on the inner-joined profiles
              query = query.in("profiles.section", sections);
            }
          } else {
            // If no sections are managed and no "Global" access, return empty
            setCertificates([]);
            setLoading(false);
            return;
          }
        }

        const result = await query.order("created_at", { ascending: false });
        data = result.data;
        fetchError = result.error;
      }

      // Fallback: use service/anon client if token auth fails
      if (fetchError || !data) {
        console.warn("Authenticated fetch failed, using fallback client");
        let fallbackQuery = serviceSupabase
          .from("certificates")
          .select("*, profiles(*)");

        if (user.role === "student") {
          fallbackQuery = fallbackQuery.eq("student_id", user.id);
        }

        const { data: fbData, error: fbErr } = await fallbackQuery.order(
          "created_at",
          { ascending: false },
        );
        if (!fbErr) {
          data = fbData;
        } else {
          console.error("Fallback also failed:", fbErr);
        }
      }

      if (data) {
        const formattedCerts: Certificate[] = data.map((c: any) => {
          // Handle Supabase returning joined profiles as either an object or an array
          const profile = Array.isArray(c.profiles)
            ? c.profiles[0]
            : c.profiles;

          // Determine if this certificate belongs to the currently logged-in student
          const isCurrentUser = user && c.student_id === user.id;

          return {
            id: c.id,
            title: c.title,
            issuer: c.issuer,
            // Fallback chain: Supabase Profile -> Local User Context (Clerk) -> Placeholder
            studentName:
              profile?.full_name ||
              (isCurrentUser ? user?.name : null) ||
              profile?.username ||
              "Unknown Scholar",
            studentId: c.student_id,
            section:
              profile?.section ||
              (isCurrentUser ? user?.section : null) ||
              "N/A",
            batch: profile?.batch || "N/A",
            rollNumber:
              profile?.roll_number ||
              (isCurrentUser ? (user as any).rollNo : null) ||
              profile?.roll_no ||
              "N/A",
            regNumber:
              profile?.reg_number ||
              (isCurrentUser ? (user as any).regNo : null) ||
              "N/A",
            type: c.type,
            issueDate: c.issue_date,
            rating: c.score
              ? c.score > 90
                ? "Platinum"
                : c.score > 75
                  ? "Gold"
                  : "Silver"
              : "Pending",
            score: c.score || 0,
            status: c.status,
            fileType: "PDF" as const,
            fileId: c.telegram_file_id,
            extractedText: c.extracted_text,
          };
        });
        setCertificates(formattedCerts);
        console.log(`[useCertificates] Fetched ${formattedCerts.length} certs`);
      }
    } catch (err) {
      console.error("[useCertificates] Unexpected error:", err);
    } finally {
      initialFetchDone.current = true;
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch with spinner
    fetchCertificates(true);

    // Silent 5-second polling — no spinner, no GSAP re-trigger
    const pollInterval = setInterval(() => fetchCertificates(false), 5000);

    // Supabase Realtime for instant push updates
    let channelRef: any = null;
    const setupRealtime = async () => {
      const token = await getToken({ template: "supabase" });
      if (!token || !user) return;

      const authenticatedSupabase = createClerkSupabaseClient(token);
      channelRef = authenticatedSupabase
        .channel(`certs_realtime_${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "certificates" },
          async (payload) => {
            console.log(
              "[Realtime]",
              payload.eventType,
              payload.new ?? payload.old,
            );
            if (payload.eventType === "INSERT") {
              await fetchCertificates(false);
            } else if (payload.eventType === "UPDATE") {
              // Instant optimistic update — no re-fetch needed
              setCertificates((current) =>
                current.map((c) =>
                  c.id === payload.new.id
                    ? {
                        ...c,
                        status: payload.new.status,
                        score: payload.new.score,
                        rating: payload.new.score
                          ? payload.new.score > 90
                            ? "Platinum"
                            : payload.new.score > 75
                              ? "Gold"
                              : "Silver"
                          : "Pending",
                      }
                    : c,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              // Fix: was === (wrong), should be !== to keep everything except deleted
              setCertificates((current) =>
                current.filter((c) => c.id !== payload.old.id),
              );
            }
          },
        )
        .subscribe((status: string) => {
          console.log("[Realtime] channel status:", status);
        });
    };

    setupRealtime();

    return () => {
      clearInterval(pollInterval);
      if (channelRef) {
        const cleanup = async () => {
          const token = await getToken({ template: "supabase" });
          if (token) createClerkSupabaseClient(token).removeChannel(channelRef);
        };
        cleanup();
      }
    };
  }, [user?.id, JSON.stringify(user?.sectionsManaged)]);

  const addCertificate = async () => {
    await fetchCertificates(false);
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = await getToken({ template: "supabase" });
      if (!token) return;
      const authenticatedSupabase = createClerkSupabaseClient(token);
      const { error } = await authenticatedSupabase
        .from("certificates")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      await fetchCertificates(false);
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  return {
    certificates,
    addCertificate,
    updateStatus,
    loading,
    refresh: () => fetchCertificates(false),
  };
}
