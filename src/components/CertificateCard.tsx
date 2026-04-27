import { motion } from "framer-motion";
import { Zap, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeoButton } from "./NeoButton";

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  studentName: string;
  studentId: string;
  fileId?: string; // Link to Telegram file_id
  section?: string;
  batch?: string;
  type: string;
  issueDate: string;
  rating: string;
  status: "verified" | "pending" | "rejected" | "approved";
  fileType: "PDF" | "IMG";
  extractedText?: {
    ai_reasoning?: string;
    [key: string]: any;
  };
}

interface CertificateCardProps {
  certificate: Certificate;
  className?: string;
  onClick?: () => void;
}

export function CertificateCard({ certificate, className, onClick }: CertificateCardProps) {
  const isVerified = certificate.status === "verified" || certificate.status === "approved";

  return (
    <motion.div 
      whileHover={{ x: -2, y: -2 }}
      whileTap={{ x: 2, y: 2 }}
      onClick={onClick}
      className={cn(
        "group h-full flex flex-col justify-between p-6 rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0_#000] transition-all cursor-pointer bg-white",
        className
      )}
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-accent shadow-xl">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <div className={cn(
            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2",
            isVerified 
              ? "bg-green-50 text-green-600 border-green-600/20" 
              : "bg-black text-white border-black"
          )}>
            {isVerified ? "VERIFIED" : "PENDING"}
          </div>
        </div>

        <h3 className="text-3xl font-black uppercase tracking-tighter leading-[0.85] mb-4 text-black">
          {certificate.title}
        </h3>
        
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">ISSUED BY {certificate.issuer || 'UNKNOWN (MANUAL VERIFICATION REQUIRED)'}</p>
          <p className="text-[10px] font-black uppercase text-zinc-500">{certificate.issueDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 border-t-4 border-black/10 mt-8">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Simple download logic
            const link = document.createElement('a');
            link.href = '#';
            link.setAttribute('download', 'certificate.pdf');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex-1 border-4 border-black py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
        >
          <Download className="w-4 h-4" />
          DOWNLOAD
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="w-14 h-14 border-4 border-black rounded-2xl hover:bg-zinc-50 transition-all bg-white flex items-center justify-center shadow-[4px_4px_0_#000] active:shadow-none active:translate-x-1 active:translate-y-1"
        >
          <ExternalLink className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

