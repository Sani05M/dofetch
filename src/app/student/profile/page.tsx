"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { UserCircle, Save, Mail, Briefcase, BadgeCheck, BookOpen, Globe, Link as LinkIcon } from "lucide-react";

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  // Profile state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [portfolioSlug, setPortfolioSlug] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username || "");
      setPortfolioSlug(profile.portfolio_slug || "");
      setBio(profile.bio || "");
      setIsPublic(profile.is_public || false);
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({
      full_name: fullName.trim() || null,
      username: username.trim() || null,
      portfolio_slug: portfolioSlug.trim() || null,
      bio: bio.trim() || null,
      is_public: isPublic
    });
    setIsSaving(false);
    if (!error) {
      alert("Profile and Portfolio updated successfully!");
    } else {
      alert("Error updating profile. The slug or username might already be taken.");
    }
  };

  return (
    <DashboardLayout allowedRole="student">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center transform rotate-3 border-2 border-bg-dark shadow-[4px_4px_0_#09090b]">
            <UserCircle className="w-8 h-8 text-bg-dark" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-text-primary">STUDENT PROFILE</h1>
            <p className="text-text-secondary font-bold text-sm uppercase tracking-widest">
              Manage your personal and academic details
            </p>
          </div>
        </div>

        <div className="bento-card mb-8">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <BadgeCheck className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-black uppercase tracking-tight text-text-primary">Registry Identity</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Legal Registry Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={profile?.full_name_locked}
                    className={`input-field w-full ${profile?.full_name_locked ? "bg-bg-dark opacity-70 cursor-not-allowed border-dashed" : ""}`}
                  />
                  {profile?.full_name_locked && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-accent uppercase tracking-tighter bg-bg-base px-2 py-1 rounded-md border border-accent/20">
                      Locked
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1 ml-2">Used for certificate verification</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Display Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. Abhi3hekkk"
                />
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-1 ml-2">Shown publicly on your portfolio</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-border/50">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Reg No.</span>
                <p className="font-mono font-bold text-text-primary text-sm">{user?.regNo || "AU/2022/..."}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Roll Number</span>
                <p className="font-mono font-bold text-text-primary text-sm">{user?.rollNo || "22CS..."}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Dept</span>
                <p className="font-bold text-text-primary text-sm">{profile?.department || "CSE"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Section</span>
                <p className="font-bold text-text-primary text-sm">{profile?.section || "A"}</p>
              </div>
            </div>
          </div>
        </div>


        <div className="bento-card">
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
            <Globe className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-black uppercase tracking-tight text-text-primary">Public Portfolio</h2>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-2 flex items-center gap-2">
                <LinkIcon className="w-3 h-3"/> Portfolio Slug
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-text-secondary bg-bg-dark px-3 py-3 rounded-xl border-2 border-border hidden sm:block">
                  do-fetch.vercel.app/portfolio/
                </span>
                <input 
                  type="text" 
                  value={portfolioSlug}
                  onChange={(e) => setPortfolioSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="input-field flex-1"
                  placeholder="your-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-2">Professional Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="input-field min-h-[100px] resize-y"
                placeholder="Brief summary of your academic focus and goals..."
                maxLength={300}
              />
            </div>

            <div className="flex items-center gap-3 ml-2">
              <input 
                type="checkbox" 
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 accent-accent"
              />
              <label htmlFor="isPublic" className="text-sm font-bold text-text-primary cursor-pointer">
                Make Portfolio Public
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-8">
              <button 
                type="submit" 
                disabled={isSaving}
                className="btn-primary"
              >
                {isSaving ? "Saving..." : "Save All Changes"}
                <Save className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
