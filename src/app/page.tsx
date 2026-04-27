"use client";

import React from "react";
import Link from "next/link";
import { 
  Zap, 
  ShieldCheck, 
  Star, 
  LayoutGrid, 
  CheckCircle2,
  Lock,
  Search,
  Globe,
  Plus,
  Play,
  Apple,
  MessageCircle,
  FileText,
  Bookmark,
  Video,
  Image as ImageIcon,
  Heart,
  ArrowRight
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedSection, containerVariants, itemVariants } from "@/components/AnimatedSection";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans selection:bg-accent selection:text-bg-dark">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-accent rounded flex items-center justify-center transform rotate-45">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-bg-dark -rotate-45 fill-current" />
            </div>
            <span className="font-black text-xl md:text-2xl tracking-tighter text-text-primary uppercase">ADAMAS</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-black uppercase tracking-tight">
            <Link href="#" className="hover:text-accent transition-colors">Academics</Link>
            <Link href="#" className="hover:text-accent transition-colors">Registry</Link>
            <Link href="#" className="hover:text-accent transition-colors">Verification</Link>
            <Link href="#" className="hover:text-accent transition-colors">Support</Link>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/login/faculty" className="text-xs md:text-sm font-black uppercase tracking-tight hover:text-accent transition-colors">
                Faculty
              </Link>
              
              <SignedIn>
                <div className="p-1 rounded-xl border border-border bg-bg-surface shadow-sm">
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 md:w-9 md:h-9 rounded-lg",
                      }
                    }}
                  />
                </div>
              </SignedIn>

              <SignedOut>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Link href="/login/student" className="bg-accent text-[#000] px-5 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black shadow-[4px_4px_0px_#000] border-2 border-bg-dark block transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000]">
                    Vault
                  </Link>
                </motion.div>
              </SignedOut>
            </div>
            
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-bg-surface border-2 border-border rounded-xl"
            >
              <motion.span 
                animate={isMobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                className="w-5 h-0.5 bg-text-primary rounded-full"
              />
              <motion.span 
                animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="w-5 h-0.5 bg-text-primary rounded-full"
              />
              <motion.span 
                animate={isMobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                className="w-5 h-0.5 bg-text-primary rounded-full"
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:hidden absolute top-16 md:top-20 left-0 right-0 bg-bg-surface border-b-4 border-border shadow-2xl p-6 z-40"
            >
              <div className="flex flex-col gap-6 text-center">
                {["Academics", "Registry", "Verification", "Support"].map((item) => (
                  <Link 
                    key={item} 
                    href="#" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xl font-black uppercase tracking-tighter hover:text-accent transition-colors"
                  >
                    {item}
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                <div className="flex flex-col gap-4">
                  <Link 
                    href="/login/faculty"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-black uppercase tracking-tighter text-text-secondary"
                  >
                    Faculty Authority
                  </Link>
                  <Link 
                    href="/login/student"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-accent text-[#09090b] py-4 rounded-2xl text-xl font-black uppercase tracking-tighter border-3 border-bg-dark shadow-[4px_4px_0px_#09090b]"
                  >
                    Student Vault
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="pt-16">
        {/* Hero Section */}
        <AnimatedSection>
          <section className="pt-20 md:pt-40 pb-16 md:pb-20 px-4 md:px-6 text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-bg-surface rounded-full text-[10px] md:text-xs font-bold mb-6 md:mb-8 border border-border">
              <ShieldCheck className="w-3 h-3 text-accent fill-current" />
              <span>Official Digital Credential Registry</span>
            </div>
            
            <h1 className="text-4xl xs:text-5xl md:text-[5.5rem] font-black leading-[0.9] md:leading-[0.85] tracking-tighter uppercase mb-6 mx-auto">
              YOUR SECURE ACADEMIC<br className="hidden xs:block" /> CREDENTIAL VAULT
            </h1>
            
            <p className="text-xs md:text-base text-text-secondary font-medium mb-8 max-w-2xl mx-auto px-4 md:px-0">
              Access, verify, and share your Adamas University transcripts and certificates instantly with our state-of-the-art cryptographic registry.
            </p>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ x: 6, y: 6 }}
            >
              <Link href="/login/student" className="bg-accent text-[#000] px-6 md:px-8 py-3 md:py-4 rounded-full text-base md:text-lg font-black inline-flex items-center gap-3 shadow-[6px_6px_0px_#000] md:shadow-[8px_8px_0px_#000] border-2 md:border-4 border-bg-dark transition-all active:shadow-none">
                Enter Student Portal
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </motion.div>

            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-[10px] md:text-xs font-bold mt-10 md:mt-12">
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-bg-surface rounded-full border border-border">
                <Lock className="w-3 h-3 md:w-4 md:h-4 text-green-500" /> End-to-End Encrypted
              </div>
              <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-bg-surface rounded-full border border-border">
                <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-blue-500" /> Universally Verified
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Floating Dashboard Mockup */}
        <AnimatedSection delay={0.2}>
          <section className="max-w-5xl mx-auto px-4 md:px-6 mb-16 md:mb-24 perspective-[2000px]">
            <div className="w-full aspect-[4/3] xs:aspect-[16/9] bg-bg-surface rounded-xl md:rounded-2xl border-2 md:border-4 border-border shadow-[0_15px_40px_rgba(0,0,0,0.1)] overflow-hidden transform md:rotate-x-[5deg] transition-transform duration-700 ease-out">
              <div className="h-8 md:h-10 bg-bg-base border-b border-border flex items-center px-3 md:px-4 gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-400" />
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-400" />
                <div className="ml-2 md:ml-4 flex-1 bg-bg-surface rounded-md h-5 md:h-6 border border-border" />
              </div>
              <div className="p-4 md:p-8 bg-bg-base h-full flex items-center justify-center">
                <div className="w-full h-full bg-bg-surface rounded-lg md:rounded-xl shadow-sm border border-border p-4 md:p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="h-6 md:h-8 w-32 md:w-48 bg-bg-base rounded" />
                    <div className="h-6 w-6 md:h-8 md:w-8 bg-accent rounded-full" />
                  </div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    <div className="md:col-span-2 bg-bg-base rounded-lg p-3 md:p-4 border border-border">
                      <div className="h-3 w-1/4 bg-green-200 rounded mb-3 md:mb-4" />
                      <div className="h-4 md:h-6 w-3/4 bg-bg-surface border border-border rounded mb-2" />
                      <div className="h-3 md:h-4 w-1/2 bg-bg-surface border border-border rounded" />
                    </div>
                    <div className="hidden md:block bg-accent/20 rounded-lg border border-accent/30 p-4" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Trusted By */}
        <AnimatedSection delay={0.4}>
          <section className="text-center mb-16 md:mb-32 opacity-50 px-4">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6">Certificates recognized globally by</p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 grayscale">
              <span className="font-black text-lg md:text-xl">Google</span>
              <span className="font-black text-lg md:text-xl">Microsoft</span>
              <span className="font-black text-lg md:text-xl">Deloitte</span>
              <span className="font-black text-lg md:text-xl">Amazon</span>
              <span className="font-black text-lg md:text-xl">TCS</span>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection>
          <h2 className="text-center text-2xl md:text-4xl font-black uppercase tracking-tighter mb-12 md:text-16 px-4 leading-none">
            WITH ADAMAS REGISTRY, YOU CAN
          </h2>
        </AnimatedSection>

        {/* Dark Feature Section */}
        <AnimatedSection>
          <section className="max-w-6xl mx-auto px-4 md:px-6 mb-12 md:mb-16">
            <div className="bg-bg-dark text-text-on-dark rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12 overflow-hidden relative">
              <div className="flex-1 z-10 text-center md:text-left">
                <h3 className="text-4xl md:text-6xl font-black text-accent uppercase leading-[0.9] tracking-tighter mb-6">
                  PROVE YOUR<br />ACHIEVEMENTS
                </h3>
                <p className="opacity-80 font-medium max-w-sm mx-auto md:mx-0 text-sm md:text-base">
                  Instantly generate cryptographically secure verification links for employers, ensuring zero friction in your hiring process.
                </p>
              </div>
              <div className="flex-1 w-full bg-bg-surface text-text-primary rounded-xl md:rounded-2xl border-2 md:border-4 border-accent p-4 md:p-6 z-10 shadow-[0_0_50px_rgba(253,224,71,0.2)]">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-accent rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#09090b]" />
                  </div>
                  <span className="font-black text-base md:text-lg">Verification Portal</span>
                </div>
                <div className="space-y-2 md:space-y-3">
                  <div className="h-8 md:h-10 bg-bg-base border border-border rounded-lg w-full flex items-center px-3 md:px-4">
                    <span className="w-16 md:w-20 h-2.5 md:h-3 bg-text-secondary/50 rounded-full" />
                  </div>
                  <div className="h-16 md:h-20 bg-bg-base border border-border rounded-lg w-full p-3 md:p-4 flex flex-col justify-center gap-2">
                    <span className="w-24 md:w-32 h-3 md:h-4 bg-text-secondary/50 rounded-full" />
                    <span className="w-32 md:w-48 h-2.5 md:h-3 bg-text-secondary/30 rounded-full" />
                  </div>
                  <div className="h-10 md:h-12 bg-green-500/10 border border-green-500/20 rounded-lg w-full flex items-center px-3 md:px-4 text-green-600 dark:text-green-400 text-[10px] md:text-sm font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" /> Official Transcript Verified
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Grid Features */}
        <AnimatedSection>
          <section className="max-w-6xl mx-auto px-4 md:px-6 mb-20 md:mb-32 text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-6 transform rotate-45 border-2 border-border">
              <LayoutGrid className="w-5 h-5 md:w-6 md:h-6 -rotate-45 text-[#09090b]" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 px-4">
              TAKE A DEEPER DIVE INTO ADAMAS
            </h3>
            <p className="text-text-secondary font-medium mb-8 md:mb-12 text-sm md:text-base px-4">Discover all the registry technology you need in one place.</p>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: <ShieldCheck />, label: "Instant Verification" },
                { icon: <FileText />, label: "Digital Transcripts" },
                { icon: <Bookmark />, label: "Degree Portfolios" },
                { icon: <Lock />, label: "Privacy First" },
                { icon: <ImageIcon />, label: "ID Integration" },
                { icon: <CheckCircle2 />, label: "Tamper-Proof" },
                { icon: <Globe />, label: "Global Access" },
                { icon: <Zap />, label: "Fast Sync" },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="bg-bg-surface border-3 border-border rounded-xl md:rounded-2xl shadow-[4px_4px_0_#000] p-4 md:p-6 flex items-center justify-between group hover:bg-accent transition-all"
                >
                  <span className="font-black text-[11px] md:text-sm uppercase tracking-tight">{item.label}</span>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-bg-base border border-border rounded-lg flex items-center justify-center shadow-sm text-text-secondary group-hover:text-[#09090b] group-hover:bg-white group-hover:border-transparent">
                    {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4 md:w-5 md:h-5" })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* Privacy Section */}
        <AnimatedSection>
          <section className="max-w-6xl mx-auto px-4 md:px-6 mb-12 md:mb-16">
            <div className="bg-bg-dark rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-12 text-center text-text-on-dark">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-accent rounded-xl flex items-center justify-center mx-auto mb-6 text-bg-dark">
                <Lock className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-accent mb-4 px-4 leading-none">
                YOUR DATA IS HIGHLY SECURED
              </h3>
              <p className="opacity-80 font-medium mb-10 md:mb-12 text-sm md:text-base px-4">Adamas University employs banking-grade encryption for all academic records.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-left">
                {[
                  { icon: <Lock />, title: "SECURE STORAGE", desc: "All your credentials are encrypted at rest and in transit." },
                  { icon: <ShieldCheck />, title: "FACULTY AUTHORIZED", desc: "Only authorized Adamas faculty can issue or amend academic records." },
                  { icon: <FileText />, title: "YOUR CONTROL", desc: "You decide who sees your records via time-limited sharing links." },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="bg-text-on-dark/5 rounded-xl md:rounded-2xl p-6 md:p-8 border border-text-on-dark/10 hover:border-accent hover:bg-text-on-dark/10 transition-all"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-text-on-dark/10 rounded-full flex items-center justify-center text-accent mb-4 md:mb-6">
                      {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5 md:w-6 md:h-6" })}
                    </div>
                    <h4 className="font-black text-base md:text-lg uppercase tracking-tight mb-2">{item.title}</h4>
                    <p className="text-xs md:text-sm opacity-60 font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Wall of Love */}
        <AnimatedSection>
          <section className="max-w-6xl mx-auto px-4 md:px-6 mb-20 md:32 text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 text-accent mx-auto mb-4">
              <Heart className="w-10 h-10 md:w-12 md:h-12 fill-current" />
            </div>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 leading-none">
              STUDENT EXPERIENCES
            </h3>
            <p className="text-text-secondary font-medium mb-10 md:mb-12 text-sm md:text-base px-4">See what Adamas scholars say about the digital vault.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left">
              {[
                { name: "INCREDIBLY FAST", desc: "Sharing my verified transcript with recruiters took literally 10 seconds. No more waiting for paper copies!" },
                { name: "EASY TO USE", desc: "The vault interface is beautiful. I can see all my semester results and certificates in one place." },
                { name: "RECRUITERS LOVE IT", desc: "When I shared my secure link during an interview, they were blown away by the instant verification." },
                { name: "NO MORE PAPERWORK", desc: "Applying for my Master's abroad was seamless because my degree was instantly verifiable online." },
                { name: "BEAUTIFUL DESIGN", desc: "I didn't expect a university portal to look this good. It feels like a premium app." },
                { name: "SECURE & PRIVATE", desc: "I feel safe knowing my academic data is heavily encrypted and only shared when I choose." },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="bg-accent rounded-xl md:rounded-2xl p-6 md:p-8 flex flex-col justify-between text-[#000] border-3 border-bg-dark shadow-[4px_4px_0_#000] transition-all"
                >
                  <div>
                    <h4 className="font-black text-lg md:text-xl uppercase tracking-tighter mb-4">{item.name}</h4>
                    <p className="text-xs md:text-sm font-medium mb-6">"{item.desc}"</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#09090b]">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* FAQ */}
        <AnimatedSection>
          <section className="max-w-3xl mx-auto px-4 md:px-6 mb-20 md:32 text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-text-primary rounded-full mx-auto mb-6" />
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-8 md:mb-12 leading-none">
              FREQUENTLY ASKED QUESTIONS
            </h3>
            
            <div className="space-y-3 md:space-y-4 text-left">
              {[
                "HOW DO I ACCESS MY DIGITAL VAULT?",
                "ARE DIGITAL CERTIFICATES VALID FOR JOBS?",
                "WHAT HAPPENS IF I LOSE MY LOGIN?",
                "CAN ALUMNI ACCESS THE REGISTRY?"
              ].map((q, i) => (
                <div key={i} className="bg-bg-surface hover:bg-bg-base transition-colors rounded-lg md:rounded-xl p-4 md:p-6 flex items-center justify-between cursor-pointer border border-border">
                  <span className="font-black text-xs md:text-sm uppercase tracking-tight">{q}</span>
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              ))}
            </div>
          </section>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection>
          <footer className="bg-bg-dark text-text-on-dark rounded-t-[2rem] md:rounded-t-[3rem] pt-16 md:pt-20 pb-10 px-4 md:px-6 mt-16 md:mt-20">
            <div className="max-w-6xl mx-auto text-center mb-16 md:mb-20">
              <h2 className="text-4xl md:text-6xl font-black text-accent uppercase tracking-tighter mb-6 md:mb-8 leading-[0.9]">
                OWN YOUR ACADEMIC<br />FUTURE
              </h2>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ x: 4, y: 4 }}
              >
                <Link href="/login/student" className="btn-primary bg-accent text-[#09090b] px-8 py-4 rounded-full text-base md:text-lg font-black inline-block transition-all active:shadow-none">
                  Access Vault
                </Link>
              </motion.div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-accent rounded flex items-center justify-center transform rotate-45">
                    <Zap className="w-3 h-3 text-[#09090b] -rotate-45 fill-current" />
                  </div>
                  <span className="font-black text-xl tracking-tighter">ADAMAS</span>
                </div>
                <p className="text-text-secondary mb-4 text-[10px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">
                  The intelligent credential manager for Adamas Scholars.
                </p>
              </div>
              <div>
                <h4 className="font-black text-xs md:text-sm uppercase tracking-widest mb-4">Portals</h4>
                <div className="flex flex-col gap-2 md:gap-3 text-text-secondary font-medium text-xs md:text-sm">
                  <Link href="/login/student" className="hover:text-accent">Student Vault</Link>
                  <Link href="/login/faculty" className="hover:text-accent">Faculty Login</Link>
                  <Link href="#" className="hover:text-accent">Alumni Access</Link>
                </div>
              </div>
              <div>
                <h4 className="font-black text-xs md:text-sm uppercase tracking-widest mb-4 text-xs md:text-sm">University</h4>
                <div className="flex flex-col gap-2 md:gap-3 text-text-secondary font-medium text-xs md:text-sm">
                  <Link href="#" className="hover:text-accent">Admissions</Link>
                  <Link href="#" className="hover:text-accent">Departments</Link>
                  <Link href="#" className="hover:text-accent">Contact</Link>
                </div>
              </div>
              <div>
                <h4 className="font-black text-xs md:text-sm uppercase tracking-widest mb-4 text-xs md:text-sm">Legal</h4>
                <div className="flex flex-col gap-2 md:gap-3 text-text-secondary font-medium text-xs md:text-sm">
                  <Link href="#" className="hover:text-accent">Privacy Policy</Link>
                  <Link href="#" className="hover:text-accent">Data Guidelines</Link>
                </div>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/5 text-center text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              © 2026 ADAMAS UNIVERSITY REGISTRY • CRYPTOGRAPHICALLY SECURED
            </div>
          </footer>
        </AnimatedSection>
      </div>
    </div>
  );
}
