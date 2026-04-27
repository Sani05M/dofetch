"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

const BATCH_OPTIONS = [
  { label: "2021 - 2025", value: "2021-2025" },
  { label: "2022 - 2026", value: "2022-2026" },
  { label: "2023 - 2027", value: "2023-2027" },
  { label: "2024 - 2028", value: "2024-2028" },
];

const DEPT_OPTIONS = [
  { label: "Computer Science (CSE)", value: "CSE" },
  { label: "Electronics (ECE)", value: "ECE" },
  { label: "Mechanical Eng.", value: "MECH" },
  { label: "Civil Eng.", value: "CIVIL" },
  { label: "Business Admin (BBA)", value: "BBA" },
  { label: "School of Law", value: "LAW" },
];

const SECTION_OPTIONS = [
  { label: "Section A", value: "A" },
  { label: "Section B", value: "B" },
  { label: "Section C", value: "C" },
  { label: "Section D", value: "D" },
  { label: "Section E", value: "E" },
  { label: "Section F", value: "F" },
];

export default function FacultyLoginPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();

  // Auto-redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const email = user.primaryEmailAddress?.emailAddress || "";
      
      if (!user.publicMetadata.onboardingComplete) {
        router.push("/onboarding");
        return;
      }

      // For the prototype: If it's not a student email, treat it as a faculty email
      if (email.endsWith("@stu.adamasuniversity.ac.in")) {
        router.push("/student/dashboard");
      } else {
        router.push("/faculty/dashboard");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  return (
    <div className="h-screen bg-bg-surface flex flex-col md:flex-row-reverse font-sans selection:bg-accent selection:text-bg-dark overflow-hidden">
      {/* Right side: Form (Reversed for faculty) */}
      <div className="w-full md:w-[45%] bg-bg-surface p-4 sm:p-6 md:p-8 flex flex-col justify-center border-b-4 md:border-b-0 md:border-l-4 border-border h-full">
        <div className="max-w-md w-full mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 md:mb-6">
            <div className="w-6 h-6 md:w-7 md:h-7 bg-accent rounded-lg flex items-center justify-center transform rotate-45">
              <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#09090b] -rotate-45" />
            </div>
            <span className="font-black text-lg md:text-xl tracking-tighter uppercase text-text-primary">ADAMAS REGISTRY</span>
          </Link>

          <h1 className="text-2xl xs:text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-2 text-text-primary">
            FACULTY<br />
            <span className="text-accent">AUTHORITY</span>
          </h1>
          <div className="space-y-6">
            <p className="text-text-secondary font-bold mb-4 md:mb-6 text-[9px] md:text-xs uppercase tracking-widest leading-none">
              Sign in with your authority credentials to access registry controls
            </p>

            <SignInButton mode="modal">
              <button className="w-full btn-primary py-6 text-lg md:text-xl shadow-[6px_6px_0_#09090b] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#09090b] transition-all flex items-center justify-center gap-4">
                <svg className="w-6 h-6" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
                Authorize via Microsoft
                <ArrowRight className="w-6 h-6" />
              </button>
            </SignInButton>

            <div className="flex items-center gap-4 py-4">
              <div className="h-[2px] flex-1 bg-border" />
              <span className="text-[10px] font-black uppercase text-text-secondary tracking-[0.2em]">Institutional SSO</span>
              <div className="h-[2px] flex-1 bg-border" />
            </div>

            <p className="text-center text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-relaxed">
              Only <span className="text-accent">@adamasuniversity.ac.in</span> accounts<br />
              are authorized to access this restricted area.
            </p>
          </div>


          <div className="mt-8 md:mt-12 text-center">
            <p className="text-[10px] md:text-xs font-bold text-text-secondary uppercase tracking-widest">
              Level 4 Access <span className="text-accent font-black">Restricted Area</span>
            </p>
          </div>
        </div>
      </div>

      {/* Left side: Branding/Visual */}
      <div className="hidden md:flex w-[55%] p-12 items-center justify-center relative overflow-hidden bg-bg-dark text-text-on-dark">
        <div className="absolute inset-0 bg-dot-pattern opacity-10 mix-blend-overlay" />
        
        <div className="relative z-10 max-w-lg w-full">
          <div className="rounded-2xl bg-text-on-dark/5 border border-text-on-dark/10 p-12 text-center shadow-2xl -rotate-3 hover:rotate-0 transition-transform duration-500 backdrop-blur-sm">
            <div className="w-16 h-16 bg-accent text-[#09090b] rounded-2xl flex items-center justify-center mx-auto mb-8 border-4 border-transparent">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-text-on-dark">
              CONTROL THE REGISTRY.
            </h2>
            <p className="opacity-80 font-bold text-sm uppercase tracking-widest mb-8 text-text-on-dark">
              Verify artifacts, audit student submissions, and maintain the integrity of the Adamas University academic mesh.
            </p>
            
            <div className="flex flex-col gap-3 text-text-on-dark">
              {[
                "Audit Pending Artifacts",
                "Revoke Credentials",
                "Maintain Registry Integrity"
              ].map((item, i) => (
                <div key={i} className="bg-bg-dark border-2 border-text-on-dark/10 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span className="font-black text-sm uppercase tracking-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
