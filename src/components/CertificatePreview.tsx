import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X, Zap, ShieldCheck, Calendar, User, Building2, Download } from "lucide-react";
import { Certificate } from "./CertificateCard";
import { NeoButton } from "./NeoButton";

interface CertificatePreviewProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CertificatePreview({ certificate, isOpen, onClose }: CertificatePreviewProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Motion values for 3D tilt
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), { stiffness: 300, damping: 30 });

  // Shine/Glare position
  const glareOpacity = useSpring(useTransform(x, [-0.5, 0.5], [0.3, 0.6]), { stiffness: 300, damping: 30 });
  const glareX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (!certificate) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-bg-dark/40 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl bg-bg-surface backdrop-blur-2xl border-4 border-bg-dark dark:border-bg-base rounded-none overflow-hidden"
          >
            {/* Close Button */}
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-2 md:p-3 rounded-none bg-bg-surface border-2 border-bg-dark dark:border-bg-base hover:bg-accent transition-colors z-50"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </motion.button>

            <div className="flex flex-col lg:flex-row h-full max-h-[100vh] lg:max-h-[90vh] overflow-hidden">
              {/* 3D Glass Slab Visualization */}
              <div 
                className="lg:flex-[1.2] bg-zinc-950 p-2 md:p-12 flex items-center justify-center border-b lg:border-b-0 lg:border-r-4 border-border relative overflow-hidden perspective-1000 h-[30vh] lg:h-auto min-h-[160px] md:min-h-[550px]"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                  <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-accent blur-[120px]" />
                  <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent blur-[120px]" />
                </div>
                <div className="w-full flex items-center justify-center perspective-1000">
                  <motion.div 
                    style={{ 
                      rotateX: isMobile ? 0 : rotateX, 
                      rotateY: isMobile ? 0 : rotateY, 
                      transformStyle: "preserve-3d" 
                    }}
                    className="w-full max-w-[220px] xs:max-w-[280px] md:max-w-[450px] aspect-[1.586/1] bg-zinc-950 rounded-none p-3 md:p-10 border border-white/20 flex flex-col justify-between relative group overflow-hidden"
                  >
                    {/* Interactive Glare / Shine Effect */}
                    {!isMobile && (
                      <motion.div 
                        style={{ 
                          left: glareX, 
                          top: glareY, 
                          opacity: glareOpacity 
                        }}
                        className="absolute w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-white/20 to-transparent blur-3xl pointer-events-none z-10"
                      />
                    )}

                    <div className="flex justify-between items-start relative z-20" style={{ transform: "translateZ(30px)" }}>
                      <div className="flex items-center gap-1.5 md:gap-3">
                        <div className="w-5 h-5 md:w-12 md:h-12 bg-accent rounded-none flex items-center justify-center transform rotate-12 border border-black">
                          <Zap className="w-3 h-3 md:w-6 md:h-6 text-black fill-current" />
                        </div>
                        <div>
                          <div className="text-[3px] md:text-[7px] font-black uppercase tracking-[0.3em] text-white/30">ISSUER</div>
                          <div className="text-[6px] md:text-xs font-black text-accent uppercase leading-none">{certificate.issuer}</div>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-20" style={{ transform: "translateZ(50px)" }}>
                      <div className="text-[4px] md:text-[8px] font-black uppercase tracking-[0.4em] text-accent/60 mb-0.5">OFFICIAL</div>
                      <h3 className="text-[10px] xs:text-xs md:text-3xl font-black uppercase tracking-tighter leading-tight text-white">
                        {certificate.title}
                      </h3>
                    </div>

                    <div className="flex justify-between items-end relative z-20" style={{ transform: "translateZ(40px)" }}>
                      <div className="text-left">
                        <div className="text-[4px] md:text-[7px] font-black uppercase tracking-[0.3em] text-white/30">HOLDER</div>
                        <div className="text-[8px] md:text-lg font-black uppercase tracking-tight text-white leading-none">
                          {certificate.studentName}
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="text-[6px] md:text-sm font-black text-white tabular-nums leading-none">{certificate.issueDate}</div>
                         <div className="mt-0.5 md:mt-2 inline-flex items-center px-1 py-0.5 bg-green-500/10 border border-green-500/20 rounded-none text-[3px] md:text-[7px] font-black text-green-400 uppercase">
                            VERIFIED
                         </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Details Pane */}
              <div className="flex-1 p-3 md:p-12 flex flex-col justify-between bg-bg-surface overflow-hidden relative">
                {/* Verification Scanning Laser (only visible during scan) */}
                <AnimatePresence>
                  {isVerifying && (
                    <motion.div 
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5, repeat: 2, ease: "linear" }}
                      className="absolute inset-x-0 h-1 bg-accent/50 shadow-[0_0_15px_rgba(253,224,71,0.8)] z-50 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                <div className="space-y-3 md:space-y-8">
                  <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-accent text-[#09090b] rounded-none text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-black">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Registry Validated
                  </div>

                  <div className="grid grid-cols-4 gap-2 md:block md:space-y-8">
                    <div className="flex flex-col items-center text-center gap-1 md:flex-row md:text-left md:gap-5">
                      <div className="w-8 h-8 md:w-12 md:h-12 bg-bg-base border-2 border-bg-dark rounded-none flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 md:w-6 md:h-6 text-text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary">Issuer</div>
                        <div className="font-black text-[8px] md:text-xl uppercase tracking-tight truncate">{certificate.issuer}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1 md:flex-row md:text-left md:gap-5">
                      <div className="w-8 h-8 md:w-12 md:h-12 bg-bg-base border-2 border-bg-dark rounded-none flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 md:w-6 md:h-6 text-text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary">Date</div>
                        <div className="font-black text-[8px] md:text-xl uppercase tracking-tight truncate">{certificate.issueDate}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center gap-1 md:flex-row md:text-left md:gap-5">
                      <div className="w-8 h-8 md:w-12 md:h-12 bg-bg-base border-2 border-bg-dark rounded-none flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 md:w-6 md:h-6 text-text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[6px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary">Holder</div>
                        <div className="font-black text-[8px] md:text-xl uppercase tracking-tight truncate">{certificate.studentName.split(' ')[0]}</div>
                      </div>
                    </div>

                    {/* QR Code Trust Link (Mobile Only) */}
                    <div className="flex flex-col items-center text-center gap-1 md:hidden">
                      <div className="w-8 h-8 bg-white border border-bg-dark rounded-none p-1 flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                          <div className="bg-black" /><div className="bg-transparent" />
                          <div className="bg-transparent" /><div className="bg-black" />
                        </div>
                      </div>
                      <div className="text-[6px] font-black uppercase tracking-widest text-text-secondary">Trust</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 md:pt-10 border-t border-border mt-3 md:mt-10 grid grid-cols-2 gap-3 md:flex md:flex-col lg:flex-row md:gap-4">
                  <NeoButton variant="primary" className="py-2.5 md:py-4 text-[10px] md:text-sm rounded-none shadow-none">
                    <Download className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    Download
                  </NeoButton>
                  <NeoButton 
                    variant="outline" 
                    className={`py-2.5 md:py-4 text-[10px] md:text-sm rounded-none shadow-none ${isVerifying ? 'animate-pulse bg-green-500/10 text-green-500 border-green-500' : ''}`}
                    onClick={() => {
                      setIsVerifying(true);
                      setTimeout(() => setIsVerifying(false), 3000);
                    }}
                  >
                    {isVerifying ? 'Scanning...' : 'Verify Chain'}
                  </NeoButton>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

