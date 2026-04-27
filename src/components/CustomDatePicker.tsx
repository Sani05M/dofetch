"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}

export function CustomDatePicker({ value, onChange, className }: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(value || new Date()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const formattedDate = newDate.toISOString().split("T")[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const renderDays = () => {
    const days = [];
    const today = new Date().toISOString().split("T")[0];

    // Empty slots for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8 md:w-10 md:h-10"></div>);
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split("T")[0];
      const isSelected = value === dateStr;
      const isToday = today === dateStr;

      days.push(
        <button
          key={day}
          onClick={(e) => { e.stopPropagation(); handleSelectDate(day); }}
          className={cn(
            "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-[10px] md:text-xs font-black transition-all",
            isSelected 
              ? "bg-accent text-bg-dark shadow-[2px_2px_0_#000]" 
              : isToday 
                ? "border-2 border-accent text-accent" 
                : "text-text-secondary hover:bg-white/5 hover:text-white"
          )}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  const [inputValue, setInputValue] = useState(() => {
    if (!value) return "";
    const date = new Date(value);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  });

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        setInputValue(`${d}/${m}/${y}`);
        setCurrentMonth(date);
      }
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    let formattedValue = rawValue;

    if (rawValue.length > 2) {
      formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2)}`;
    }
    if (rawValue.length > 4) {
      formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}/${rawValue.slice(4, 8)}`;
    }

    setInputValue(formattedValue);
  };

  const handleBlur = () => {
    const parts = inputValue.split("/");
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      let y = parseInt(parts[2], 10);
      
      if (y < 100) y += 2000;

      const newDate = new Date(y, m, d);
      if (!isNaN(newDate.getTime()) && newDate.getDate() === d) {
        onChange(newDate.toISOString().split("T")[0]);
        setCurrentMonth(newDate);
      }
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        className={cn(
          "w-full bg-bg-surface border-3 border-border rounded-xl px-5 py-3.5 md:py-4 flex items-center justify-between transition-all focus-within:border-accent hover:shadow-[4px_4px_0_var(--color-border)] focus-within:shadow-[4px_4px_0_var(--color-accent)]",
          isOpen && "border-accent shadow-[4px_4px_0_var(--color-accent)]"
        )}
      >
        <input 
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="DD/MM/YYYY"
          className="w-full bg-transparent text-[10px] md:text-xs font-black uppercase tracking-widest text-text-primary focus:outline-none placeholder:text-text-secondary"
        />
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="ml-2 focus:outline-none">
          <CalendarIcon className={cn("w-4 h-4 md:w-5 md:h-5 text-text-secondary transition-colors shrink-0", isOpen && "text-accent")} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-[280px] md:w-[320px] right-0 mt-3 p-4 bg-[#09090b] border-4 border-zinc-800 rounded-3xl shadow-[8px_8px_0_#000]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={handlePrevMonth} className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </div>
            <button onClick={handleNextMonth} className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
              <div key={day} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
}
