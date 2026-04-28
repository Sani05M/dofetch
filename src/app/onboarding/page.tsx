"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ChevronRight, GraduationCap, Briefcase, Loader2, Database } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoaded && user?.publicMetadata?.onboardingComplete) {
      const isStudent = user.primaryEmailAddress?.emailAddress?.endsWith("@stu.adamasuniversity.ac.in");
      if (isStudent) {
        router.push("/student/dashboard");
      } else {
        router.push("/faculty/dashboard");
      }
    }
  }, [isLoaded, user, router]);
  
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [department, setDepartment] = useState("");
  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [sectionsManaged, setSectionsManaged] = useState<string[]>([]);
  
  // Determine role based on email (prototype logic)
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const isStudent = email.endsWith("@stu.adamasuniversity.ac.in");
  const role = isStudent ? "student" : "faculty";

  const handleToggleSection = (sec: string) => {
    if (sectionsManaged.includes(sec)) {
      setSectionsManaged(sectionsManaged.filter(s => s !== sec));
    } else {
      setSectionsManaged([...sectionsManaged, sec]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: role,
          fullName: fullName,
          email: email,
          department: department,
          batch: isStudent ? batch : null,
          section: isStudent ? section : null,
          rollNumber: isStudent ? rollNumber : null,
          regNumber: isStudent ? regNumber : null,
          sectionsManaged: !isStudent ? sectionsManaged : null,
        }),
      });

      if (response.ok) {
        // Force Clerk to refresh the session token to pull in the new publicMetadata immediately
        await user?.reload();
        
        if (isStudent) {
          router.push("/student/dashboard");
        } else {
          router.push("/faculty/dashboard");
        }
      } else {
        const data = await response.json();
        alert(`Failed to save profile: ${data.error || "Unknown error"}`);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during onboarding.");
      setLoading(false);
    }
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4 selection:bg-accent selection:text-bg-dark font-sans">
      <div className="w-full max-w-2xl bg-bg-surface border-4 border-border rounded-[2rem] p-8 md:p-12 shadow-[12px_12px_0_var(--color-text-primary)] relative overflow-hidden">
        
        {/* Background Decorative Mesh */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-text-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-bg-dark rounded-2xl flex items-center justify-center shadow-[4px_4px_0_var(--color-text-primary)] mb-6 border-2 border-border transform -rotate-3 hover:rotate-0 transition-transform">
            <Database className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-text-primary leading-tight mb-2">
            Establish<br/><span className="text-accent">Registry Profile</span>
          </h1>
          <p className="text-xs md:text-sm font-bold text-text-secondary uppercase tracking-widest max-w-sm">
            Configure your institutional parameters to initialize your secure session.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="p-4 border-2 border-border rounded-xl bg-bg-base mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-bg-dark shrink-0 shadow-[2px_2px_0_#000] border-2 border-bg-dark">
              {isStudent ? <GraduationCap className="w-6 h-6" /> : <Briefcase className="w-6 h-6" />}
            </div>
            <div className="text-left min-w-0">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Detected Identity</p>
              <p className="text-sm font-bold text-text-primary uppercase tracking-tight truncate">{email}</p>
              <p className="text-xs font-black text-accent uppercase tracking-widest mt-0.5">{role} Access</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-text-primary mb-2">Legal Full Name (For Certificate Verification)</label>
              <input 
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your real name..."
                className="w-full bg-bg-base border-3 border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-secondary/30 focus:border-text-primary focus:outline-none shadow-[2px_2px_0_var(--color-border)] hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all"
              />
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-2 flex items-center gap-1 italic">
                ⚠️ This name will be locked and used to verify all certificate uploads.
              </p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-text-primary mb-2">Department / Program</label>
              <select 
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-bg-base border-3 border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-text-primary focus:outline-none focus:ring-0 appearance-none shadow-[2px_2px_0_var(--color-border)] hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all"
              >
                <option value="" disabled>Select Department...</option>
                <option value="CSE">Computer Science & Eng. (CSE)</option>
                <option value="ECE">Electronics & Comm. (ECE)</option>
                <option value="ME">Mechanical Eng. (ME)</option>
                <option value="BBA">Business Administration (BBA)</option>
              </select>
            </div>

            {isStudent && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-text-primary mb-2">Academic Batch</label>
                    <select 
                      required
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full bg-bg-base border-3 border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-text-primary focus:outline-none appearance-none shadow-[2px_2px_0_var(--color-border)] hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all"
                    >
                      <option value="" disabled>Select...</option>
                      <option value="2021">2021-2025</option>
                      <option value="2022">2022-2026</option>
                      <option value="2023">2023-2027</option>
                      <option value="2024">2024-2028</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-text-primary mb-2">Section</label>
                    <select 
                      required
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full bg-bg-base border-3 border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary focus:border-text-primary focus:outline-none appearance-none shadow-[2px_2px_0_var(--color-border)] hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all"
                    >
                      <option value="" disabled>Select...</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                      <option value="D">Section D</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-text-primary mb-2">University Roll No.</label>
                    <input 
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. AU22010..."
                      className="w-full bg-bg-base border-3 border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-secondary/30 focus:border-text-primary focus:outline-none shadow-[2px_2px_0_var(--color-border)] hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-text-primary mb-2">Registration No.</label>
                    <input 
                      type="text"
                      required
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      placeholder="e.g. 2022123..."
                      className="w-full bg-bg-base border-3 border-border rounded-xl px-4 py-3 text-sm font-bold text-text-primary placeholder:text-text-secondary/30 focus:border-text-primary focus:outline-none shadow-[2px_2px_0_var(--color-border)] hover:shadow-[4px_4px_0_var(--color-text-primary)] transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {!isStudent && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-text-primary mb-2">Managed Sections (Multi-Select)</label>
                <div className="flex flex-wrap gap-3">
                  {["A", "B", "C", "D"].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleToggleSection(sec)}
                      className={`w-14 h-14 rounded-xl border-3 font-black text-xl flex items-center justify-center transition-all ${
                        sectionsManaged.includes(sec) 
                        ? "bg-accent border-bg-dark text-bg-dark shadow-[4px_4px_0_#000]" 
                        : "bg-bg-base border-border text-text-secondary hover:border-text-primary hover:text-text-primary"
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
                {sectionsManaged.length === 0 && (
                  <p className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest mt-2">Please select at least one section</p>
                )}
              </div>
            )}
          </div>

          <div className="pt-6 border-t-2 border-border mt-8">
            <button 
              type="submit" 
              disabled={loading || (!isStudent && sectionsManaged.length === 0)}
              className="w-full py-4 px-6 bg-text-primary text-bg-base font-black uppercase tracking-widest rounded-xl hover:bg-accent hover:text-bg-dark transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0_var(--color-border)] hover:shadow-[6px_6px_0_#000] disabled:opacity-50 disabled:cursor-not-allowed border-3 border-transparent disabled:hover:shadow-[4px_4px_0_var(--color-border)]"
            >
              {loading ? (
                <>Initializing Profile <Loader2 className="w-5 h-5 animate-spin" /></>
              ) : (
                <>Finalize & Enter Dashboard <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
