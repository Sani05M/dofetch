"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | string[];
  onChange: (value: any) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export function CustomSelect({ options, value, onChange, multiple = false, placeholder = "Select...", className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.length === 0) return placeholder;
      if (currentValues.length === 1) return options.find(o => o.value === currentValues[0])?.label;
      return `${currentValues.length} selected`;
    }
    if (!value) return placeholder;
    return options.find(o => o.value === value)?.label || placeholder;
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-white border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold text-bg-dark flex items-center justify-between transition-colors focus:outline-none focus:border-accent hover:border-zinc-300",
          isOpen && "border-accent"
        )}
      >
        <span className={!value || (multiple && value.length === 0) ? "text-zinc-400" : "text-bg-dark"}>
          {getDisplayValue()}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-3 border-bg-dark rounded-xl shadow-[4px_4px_0_#09090b] overflow-hidden max-h-60 overflow-y-auto">
          {options.map((option) => {
            const isSelected = multiple 
              ? (Array.isArray(value) && value.includes(option.value))
              : value === option.value;
              
            return (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "px-4 py-3 text-sm font-bold cursor-pointer transition-colors flex items-center justify-between",
                  isSelected ? "bg-accent/10 text-bg-dark" : "text-zinc-600 hover:bg-zinc-100 hover:text-bg-dark"
                )}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-accent" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
