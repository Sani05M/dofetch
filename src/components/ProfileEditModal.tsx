"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Hash, BookOpen, AlertTriangle,
  CheckCircle, Lock, GraduationCap, Building2, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@clerk/nextjs";

// ─── Predefined options ───────────────────────────────────────────────────────
const DEPARTMENTS = [
  { code: "BTCSE",   label: "B.Tech — Computer Science & Engineering" },
  { code: "BTCSC",   label: "B.Tech — CSE (Cyber Security)" },
  { code: "BTCSAI",  label: "B.Tech — CSE (AI & ML)" },
  { code: "BTIT",    label: "B.Tech — Information Technology" },
  { code: "BTECE",   label: "B.Tech — Electronics & Communication" },
  { code: "BTME",    label: "B.Tech — Mechanical Engineering" },
  { code: "BTCE",    label: "B.Tech — Civil Engineering" },
  { code: "BCA",     label: "BCA — Computer Applications" },
  { code: "MCA",     label: "MCA — Computer Applications" },
  { code: "MBA",     label: "MBA — Business Administration" },
  { code: "MTECH",   label: "M.Tech — Computer Science" },
];

// Generate batches: current year ± 4 window, 4-year spans
const CURRENT_YEAR = new Date().getFullYear();
const BATCHES: string[] = [];
for (let y = CURRENT_YEAR - 4; y <= CURRENT_YEAR + 2; y++) {
  BATCHES.push(`${y}-${y + 4}`);
}

const SECTIONS = ["A", "B", "C", "D", "E", "F"];

// ─── Format validators ────────────────────────────────────────────────────────
const ROLL_REGEX = /^[A-Z]+\/\d{2}\/[A-Z]+\/\d{4}\/\d{3,4}$/;
const REG_REGEX  = /^AU\/\d{4}\/\d{6,8}$/;
interface ProfileData {
  full_name:        string;
  username:         string;
  full_name_locked: boolean;
  department:       string;
  roll_no:          string;
  reg_no:           string;
  section:          string;
  batch:            string;
  sections_managed: string[];
  batches_managed:  string[];
  faculty_id:       string;
  edit_count:       number;
  max_edits:        number;
  editsRemaining:   number;
  role:             string;
}

// ─── Custom dropdown ──────────────────────────────────────────────────────────
function SelectField({
  label, icon, value, onChange, options, placeholder, accent = false,
}: {
  label:       string;
  icon:        React.ReactNode;
  value:       string;
  onChange:    (v: string) => void;
  options:     { code: string; label: string }[];
  placeholder: string;
  accent?:     boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.code === value);

  return (
    <div ref={ref} className="relative">
      <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1.5">
        {icon} {label}
      </label>

      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen((p) => !p)}
        whileTap={{ x: 1, y: 1 }}
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-bg-base border-2 rounded-xl text-sm font-medium text-left transition-all ${
          open
            ? "border-bg-dark shadow-[2px_2px_0_#000]"
            : "border-border hover:border-bg-dark hover:shadow-[2px_2px_0_#000]"
        }`}
      >
        <span className={selected ? "text-text-primary" : "text-text-secondary/50"}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />
        </motion.span>
      </motion.button>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1     }}
            exit={{   opacity: 0, y: -6, scale: 0.97   }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1.5 w-full bg-bg-surface border-2 border-bg-dark shadow-[4px_4px_0_#000] rounded-xl overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto">
              {options.map((o) => {
                const isActive = o.code === value;
                return (
                  <li key={o.code}>
                    <button
                      type="button"
                      onClick={() => { onChange(o.code); setOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                        isActive
                          ? accent
                            ? "bg-[#ef4444] text-white"
                            : "bg-accent text-bg-dark"
                          : "hover:bg-bg-base text-text-primary"
                      }`}
                    >
                      <span>{o.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Toggle pill grid (single or multi) ──────────────────────────────────────
function PillGrid({
  label, icon, options, selected, onToggle, multi = true, accent = "bg-accent text-bg-dark",
}: {
  label:    string;
  icon:     React.ReactNode;
  options:  string[];
  selected: string | string[];
  onToggle: (v: string) => void;
  multi?:   boolean;
  accent?:  string;
}) {
  const isSelected = (v: string) =>
    multi ? (selected as string[]).includes(v) : selected === v;

  return (
    <div>
      <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1.5">
        {icon} {label}
        {multi && (
          <span className="normal-case font-normal text-text-secondary/50 text-[8px]">— select all that apply</span>
        )}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = isSelected(opt);
          return (
            <motion.button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              whileTap={{ scale: 0.93 }}
              className={`px-3 py-1.5 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                active
                  ? `${accent} border-bg-dark shadow-[2px_2px_0_#000]`
                  : "bg-bg-base border-border text-text-secondary hover:border-bg-dark"
              }`}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Simple text field ────────────────────────────────────────────────────────
function TextField({
  label, icon, value, onChange, placeholder, mono = false,
  error, hint,
}: {
  label:       string;
  icon:        React.ReactNode;
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  mono?:       boolean;
  error?:      string;
  hint?:       string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-secondary mb-1.5">
        {icon} {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 bg-bg-base border-2 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-text-secondary/50 ${
          mono ? "font-mono" : ""
        } ${
          error
            ? "border-red-500 focus:shadow-[2px_2px_0_#ef4444]"
            : "border-border focus:border-bg-dark focus:shadow-[2px_2px_0_#000]"
        }`}
      />
      {error && <p className="text-[9px] text-red-500 mt-1 font-medium">{error}</p>}
      {hint && !error && <p className="text-[9px] text-text-secondary/50 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

export function ProfileEditModal({ isOpen, onClose }: Props) {
  const { user, refresh }   = useAuth();
  const { user: clerkUser } = useUser();
  const overlayRef          = useRef<HTMLDivElement>(null);

  const [profile,         setProfile]         = useState<ProfileData | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [success,         setSuccess]         = useState(false);

  // form
  const [displayName,     setDisplayName]     = useState("");
  const [username,        setUsername]        = useState("");
  const [department,      setDepartment]      = useState("");
  const [rollNo,          setRollNo]          = useState("");
  const [regNo,           setRegNo]           = useState("");
  const [section,         setSection]         = useState("");
  const [batch,           setBatch]           = useState("");
  const [sectionsManaged, setSectionsManaged] = useState<string[]>([]);
  const [batchesManaged,  setBatchesManaged]  = useState<string[]>([]);
  const [facultyId,       setFacultyId]       = useState("");
  const [showCorrection,  setShowCorrection]  = useState(false);

  // ── Fetch on open ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true); setError(null); setSuccess(false);

    fetch("/api/profile/update")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setProfile(d);
        setDisplayName(d.full_name            || "");
        setUsername(d.username              || "");
        setDepartment(d.department             || "");
        setRollNo(d.roll_no                    || "");
        setRegNo(d.reg_no                      || "");
        setSection(d.section                   || "");
        setBatch(d.batch                       || "");
        setSectionsManaged(d.sections_managed  || []);
        setBatchesManaged(d.batches_managed    || []);
        setFacultyId(d.faculty_id              || "");
        
        // Auto-show correction if name looks like a username (contains numbers)
        if (d.full_name && /\d/.test(d.full_name) && !d.full_name_locked) {
          setShowCorrection(true);
        }
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // ── Toggle helpers ───────────────────────────────────────────────────────
  const toggleBatch = (b: string) =>
    setBatchesManaged((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );

  const toggleSection = (s: string) =>
    setSectionsManaged((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  // ── Validation ───────────────────────────────────────────────────────────
  const rollErr = rollNo && !ROLL_REGEX.test(rollNo.toUpperCase()) ? "Format: UG/02/BTCSE/2023/011" : undefined;
  const regErr  = regNo  && !REG_REGEX.test(regNo.toUpperCase())   ? "Format: AU/2023/0008918"       : undefined;
  const canSubmit = !rollErr && !regErr && !saving && (profile?.editsRemaining ?? 0) > 0;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true); setError(null);

    const payload: Record<string, any> = { display_name: displayName, username, department };

    if (user?.role === "student") {
      payload.roll_no = rollNo;
      payload.reg_no  = regNo;
      payload.section = section;
      payload.batch   = batch;
    } else {
      payload.sections_managed = sectionsManaged;
      payload.batches_managed  = batchesManaged;
      payload.faculty_id       = facultyId;
    }

    try {
      const res  = await fetch("/api/profile/update", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Update failed."); return; }

      // Reload Clerk and AuthContext → updates everything instantly
      await refresh();

      setSuccess(true);
      setProfile((p: ProfileData | null) =>
        p ? { ...p, editsRemaining: data.editsRemaining, edit_count: p.max_edits - data.editsRemaining } : p
      );
      setTimeout(onClose, 1600);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isLocked  = profile ? profile.editsRemaining <= 0 : false;
  const isFaculty = user?.role === "faculty";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }}
            animate={{ scale: 1,   opacity: 1, y: 0   }}
            exit={{   scale: 0.9, opacity: 0, y: 24   }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="relative w-full max-w-md bg-bg-surface border-2 border-bg-dark shadow-[6px_6px_0_#000] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* ── Header ── */}
            <div className={`px-6 pt-5 pb-4 border-b-2 border-bg-dark flex items-start justify-between shrink-0 ${
              isFaculty ? "bg-[#ef4444]/10" : "bg-accent/10"
            }`}>
              <div>
                <p className={`text-[9px] font-black uppercase tracking-widest ${isFaculty ? "text-[#ef4444]" : "text-accent"}`}>
                  {isFaculty ? "Authority" : "Student"} · Edit Profile
                </p>
                <h2 className="text-xl font-black tracking-tight mt-0.5">
                  {isLocked ? "Profile Locked" : "Update Your Details"}
                </h2>
                {profile && !isLocked && (
                  <span className={`mt-1.5 inline-flex text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    profile.editsRemaining === 1
                      ? "text-amber-600 bg-amber-500/10 border-amber-400/40"
                      : "text-green-600 bg-green-500/10 border-green-400/40"
                  }`}>
                    {profile.editsRemaining} edit{profile.editsRemaining !== 1 ? "s" : ""} remaining
                  </span>
                )}
                {isLocked && (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-400/40">
                    <Lock className="w-2.5 h-2.5" /> No edits remaining
                  </span>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-base transition-colors mt-0.5 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className={`w-8 h-8 border-4 border-bg-base rounded-full animate-spin ${isFaculty ? "border-t-[#ef4444]" : "border-t-accent"}`} />
                </div>
              ) : isLocked ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-bg-base border-2 border-bg-dark flex items-center justify-center shadow-[3px_3px_0_#000]">
                    <Lock className="w-7 h-7 text-text-secondary" />
                  </div>
                  <p className="font-black text-base">Edit limit reached</p>
                  <p className="text-text-secondary text-xs leading-relaxed max-w-[260px]">
                    You have used all {profile?.max_edits} allowed edit{profile?.max_edits !== 1 ? "s" : ""}. Contact your administrator for further changes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  {/* Name section — Dual Identity */}
                  <div className="space-y-4">
                    {/* Public persona */}
                    <TextField
                      label="Display Username" icon={<User className="w-3 h-3" />}
                      value={username} onChange={setUsername}
                      placeholder="e.g. Abhi3hekkk"
                    />

                    {/* Legal Identity — Correction logic */}
                    <div className="p-4 bg-bg-base border-2 border-border rounded-2xl relative overflow-hidden">
                      <label className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-text-secondary mb-2">
                        <Lock className="w-3 h-3" /> Legal Registry Name
                      </label>
                      
                      {!showCorrection && profile?.full_name ? (
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-bold text-sm text-text-primary uppercase tracking-tight">
                            {profile.full_name}
                          </p>
                          {!profile.full_name_locked && (
                            <button 
                              type="button"
                              onClick={() => setShowCorrection(true)}
                              className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                            >
                              Correction
                            </button>
                          )}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Legal Full Name (Institutional)"
                          className="w-full bg-transparent font-black text-sm uppercase tracking-tight outline-none border-b border-accent/30 pb-1 focus:border-accent transition-all"
                        />
                      )}
                      
                      <p className="text-[8px] font-bold text-text-secondary/60 uppercase tracking-widest mt-2 leading-relaxed">
                        This name must match your ID for certificate verification. 
                        {profile?.full_name_locked ? " Locked by system." : ""}
                      </p>
                    </div>
                  </div>

                  {/* Department — both — custom dropdown */}
                  <SelectField
                    label="Department" icon={<Building2 className="w-3 h-3" />}
                    value={department} onChange={setDepartment}
                    options={DEPARTMENTS}
                    placeholder="Select your department…"
                    accent={isFaculty}
                  />

                  {/* ── STUDENT fields ── */}
                  {!isFaculty && (
                    <>
                      <TextField
                        label="Roll Number" icon={<Hash className="w-3 h-3" />}
                        value={rollNo} onChange={setRollNo}
                        placeholder="UG/02/BTCSE/2023/011" mono
                        error={rollErr} hint="Format: DEGREE/CODE/DEPT/YEAR/SERIAL"
                      />
                      <TextField
                        label="Registration Number" icon={<BookOpen className="w-3 h-3" />}
                        value={regNo} onChange={setRegNo}
                        placeholder="AU/2023/0008918" mono
                        error={regErr} hint="Format: AU/YEAR/7–8 digits"
                      />

                      {/* Batch — single select pills */}
                      <PillGrid
                        label="Batch" icon={<GraduationCap className="w-3 h-3" />}
                        options={BATCHES}
                        selected={batch}
                        onToggle={(b) => setBatch((prev) => prev === b ? "" : b)}
                        multi={false}
                        accent={isFaculty ? "bg-[#ef4444] text-white" : "bg-accent text-bg-dark"}
                      />

                      {/* Section — single select pills */}
                      <PillGrid
                        label="Section" icon={<GraduationCap className="w-3 h-3" />}
                        options={SECTIONS}
                        selected={section}
                        onToggle={(s) => setSection((prev) => prev === s ? "" : s)}
                        multi={false}
                        accent="bg-accent text-bg-dark"
                      />
                    </>
                  )}

                  {/* ── FACULTY fields ── */}
                  {isFaculty && (
                    <>
                      <TextField
                        label="Faculty ID" icon={<Hash className="w-3 h-3" />}
                        value={facultyId} onChange={setFacultyId}
                        placeholder="e.g. FAC/02/CSE/2021/001" mono
                      />

                      {/* Batches — multi select pills */}
                      <PillGrid
                        label="Batches Mentored" icon={<GraduationCap className="w-3 h-3" />}
                        options={BATCHES}
                        selected={batchesManaged}
                        onToggle={toggleBatch}
                        multi={true}
                        accent="bg-zinc-900 text-white"
                      />

                      {/* Sections — multi select pills */}
                      <PillGrid
                        label="Sections Managed" icon={<GraduationCap className="w-3 h-3" />}
                        options={SECTIONS}
                        selected={sectionsManaged}
                        onToggle={toggleSection}
                        multi={true}
                        accent="bg-[#ef4444] text-white"
                      />
                    </>
                  )}

                  {/* Last-edit warning */}
                  {profile && profile.editsRemaining === 1 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 border-2 border-amber-400/40 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 font-medium">
                        <strong>Last edit.</strong> Double-check before saving.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border-2 border-red-400/40 rounded-xl">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Success */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-3 bg-green-500/10 border-2 border-green-400/40 rounded-xl"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <p className="text-xs text-green-700 font-black uppercase tracking-wider">
                        Profile updated — synced!
                      </p>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={!canSubmit}
                    whileTap={canSubmit ? { x: 2, y: 2 } : {}}
                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 border-bg-dark transition-all ${
                      canSubmit
                        ? isFaculty
                          ? "bg-[#ef4444] text-white shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000]"
                          : "bg-accent text-bg-dark shadow-[3px_3px_0_#000] hover:shadow-[4px_4px_0_#000]"
                        : "bg-bg-base text-text-secondary cursor-not-allowed opacity-40"
                    }`}
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
