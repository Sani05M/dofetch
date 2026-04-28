"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { 
  Zap, 
  ShieldCheck, 
  Award, 
  Flame, 
  ExternalLink,
  Globe,
  User,
  BadgeCheck,
  Eye,
  Medal,
  Trophy
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CertificatePreview } from "./CertificatePreview";
import { Certificate } from "./CertificateCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface PortfolioViewerProps {
  profile: any;
  certificates: any[];
}

export function PortfolioViewer({ profile, certificates }: PortfolioViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Point system calculation (100 points per verified certificate)
  const totalPoints = certificates.length * 100;
  
  let medalName = "";
  let medalColor = "";
  let MedalIcon = Award;
  
  if (totalPoints >= 500) {
    medalName = "Gold Medalist";
    medalColor = "text-yellow-400";
    MedalIcon = Trophy;
  } else if (totalPoints >= 300) {
    medalName = "Silver Medalist";
    medalColor = "text-zinc-300";
    MedalIcon = Medal;
  } else if (totalPoints >= 100) {
    medalName = "Bronze Medalist";
    medalColor = "text-amber-700";
    MedalIcon = Medal;
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".portfolio-header", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });

      gsap.from(".stat-box", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.2
      });

      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=50",
            toggleActions: "play none none none"
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          delay: i % 3 * 0.1
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [certificates]);

  const socialIcons: Record<string, any> = {
    github: <Globe className="w-5 h-5" />,
    linkedin: <User className="w-5 h-5" />,
    twitter: <Globe className="w-5 h-5" />,
    website: <Globe className="w-5 h-5" />
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#09090b] text-white selection:bg-accent selection:text-bg-dark pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-6 pt-24 md:pt-32">
        {/* Profile Header - Clean & Bold */}
        <header className="portfolio-header mb-16 flex flex-col md:flex-row items-start md:items-end justify-between gap-10 border-b border-zinc-800/50 pb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Clean Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl md:text-5xl font-black text-accent uppercase shadow-xl relative overflow-hidden">
               <div className="absolute inset-0 bg-accent/5" />
               {profile.full_name?.charAt(0)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-md text-[10px] font-bold uppercase tracking-widest border border-accent/20">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified Portfolio
                </div>
                {medalName && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-md text-[10px] font-bold uppercase tracking-widest border border-zinc-800 ${medalColor}`}>
                    <MedalIcon className="w-3.5 h-3.5" />
                    {medalName}
                  </div>
                )}
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-4 text-white">
                {profile.full_name}
              </h1>
              <p className="text-zinc-400 font-medium text-lg md:text-xl max-w-2xl leading-relaxed">
                {profile.bio || "Academic high-achiever at Adamas University. Focused on building future-ready skills and verified credentials."}
              </p>
              
              <div className="flex items-center gap-3 mt-8">
                {profile.social_links && Object.entries(profile.social_links).map(([platform, url]) => (
                  <a key={platform} href={url as string} target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                    {socialIcons[platform] || <ExternalLink className="w-5 h-5" />}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Grid - Solid Bento */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full md:w-auto">
             <div className="stat-box px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-center items-start">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Total Points</div>
                <div className="flex items-center gap-2 text-white">
                   <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                   <span className="text-2xl font-black">{totalPoints}</span>
                </div>
             </div>
             <div className="stat-box px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-center items-start">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Day Streak</div>
                <div className="flex items-center gap-2 text-white">
                   <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                   <span className="text-2xl font-black">{(profile.streak_data as any)?.current || 0}</span>
                </div>
             </div>
             <div className="stat-box px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-center items-start col-span-2 md:col-span-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Verified Certs</div>
                <div className="flex items-center gap-2 text-white">
                   <ShieldCheck className="w-5 h-5 text-accent" />
                   <span className="text-2xl font-black">{certificates.length}</span>
                </div>
             </div>
          </div>
        </header>

        {/* Badges Section */}
        {profile.badges?.length > 0 && (
          <section className="mb-20">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Achievements</h2>
            <div className="flex flex-wrap gap-3">
               {profile.badges.map((badge: string, idx: number) => (
                 <div key={idx} className="stat-box px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2.5">
                   <Award className="w-4 h-4 text-accent" />
                   <span className="font-bold text-sm text-zinc-300">{badge.replace('_', ' ')}</span>
                 </div>
               ))}
            </div>
          </section>
        )}

        {/* Certificates Grid - Clean Bento UI */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Institutional Registry</h2>
            <div className="h-[1px] flex-1 bg-zinc-800/50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {certificates.map((certRaw, i) => {
              const cert = {
                id: certRaw.id,
                studentId: profile.id || certRaw.student_id || "unknown",
                studentName: profile.full_name,
                title: certRaw.title,
                issuer: certRaw.issuer,
                issueDate: certRaw.issue_date,
                score: certRaw.fraud_score || 100,
                status: certRaw.status as any,
                fileId: certRaw.file_path,
                fileType: certRaw.file_type?.includes('pdf') ? 'PDF' : 'IMG',
                type: certRaw.type || "Certificate",
                rating: certRaw.rating || 5
              } as Certificate;

              return (
                <div 
                  key={cert.id} 
                  ref={el => { cardsRef.current[i] = el; }}
                  className="group cursor-pointer bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-6 flex flex-col justify-between transition-colors duration-300 relative overflow-hidden"
                  onClick={() => setSelectedCert(cert)}
                >
                  {/* Subtle background icon */}
                  <ShieldCheck className="absolute -bottom-4 -right-4 w-32 h-32 text-zinc-800/20 group-hover:text-zinc-800/40 transition-colors" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                       <div className="w-10 h-10 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center">
                         <ShieldCheck className="w-5 h-5 text-accent" />
                       </div>
                       <div className="text-[10px] font-mono text-zinc-500">#{cert.id.split('-')[0]}</div>
                    </div>
                    
                    <h3 className="text-lg font-bold leading-tight mb-2 text-white group-hover:text-accent transition-colors duration-300">
                      {cert.title}
                    </h3>
                    <p className="text-zinc-500 font-medium text-xs uppercase tracking-wider mb-6">{cert.issuer}</p>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-zinc-800/50 relative z-10">
                    <div>
                      <p className="text-[10px] font-medium text-zinc-500 mb-1">Issue Date</p>
                      <p className="text-sm font-bold text-zinc-300">{cert.issueDate || 'N/A'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <CertificatePreview 
        certificate={selectedCert}
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />

      <footer className="mt-32 mb-8 text-center">
         <p className="text-xs font-medium text-zinc-600 flex items-center justify-center gap-2">
           <ShieldCheck className="w-4 h-4" />
           Verified by Adamas University Audit Mesh
         </p>
      </footer>
    </div>
  );
}
