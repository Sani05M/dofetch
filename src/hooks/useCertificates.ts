"use client";

import { useState, useEffect } from "react";
import { Certificate } from "@/components/CertificateCard";

const STORAGE_KEY = "adamos_certificates_v2";

const INITIAL_CERTS: Certificate[] = [
  {
    id: "CERT001",
    title: "Google Cloud Professional Architect",
    issuer: "Google",
    studentName: "Abhishek Singh",
    studentId: "STU2024001",
    type: "Cloud & DevOps",
    issueDate: "2024-09-15",
    rating: "Platinum",
    status: "verified",
    fileType: "PDF"
  },
  {
    id: "CERT002",
    title: "AWS Certified Developer Associate",
    issuer: "Amazon Web Services",
    studentName: "Abhishek Singh",
    studentId: "STU2024001",
    type: "Cloud & DevOps",
    issueDate: "2024-08-10",
    rating: "Platinum",
    status: "verified",
    fileType: "PDF"
  },
  {
    id: "CERT003",
    title: "React Advanced Patterns",
    issuer: "Coursera",
    studentName: "Abhishek Singh",
    studentId: "STU2024001",
    type: "Technical / Programming",
    issueDate: "2024-07-05",
    rating: "Gold",
    status: "pending",
    fileType: "IMG"
  }
];

export function useCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Ensure title exists (handle legacy 'name' field if it exists)
        const migrated = parsed.map((c: any) => ({
          ...c,
          title: c.title || c.name || "Untitled Artifact",
          studentName: c.studentName || (c.studentId ? "Abhishek Singh" : "Authorized Scholar")
        }));
        setCertificates(migrated);
      } catch (e) {
        setCertificates(INITIAL_CERTS);
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CERTS));
      setCertificates(INITIAL_CERTS);
    }
    setLoading(false);
  }, []);

  const save = (newCerts: Certificate[]) => {
    setCertificates(newCerts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCerts));
  };

  const addCertificate = (cert: Omit<Certificate, "id" | "status" | "rating" | "fileType">) => {
    const newCert: Certificate = {
      ...cert,
      id: `CERT-${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      rating: "Pending",
      fileType: "PDF" // Default to PDF if not provided
    };
    save([newCert, ...certificates]);
    return newCert;
  };

  const updateStatus = (id: string, status: "verified" | "pending" | "rejected" | "approved", rating?: any) => {
    const updated = certificates.map(c => 
      c.id === id ? { ...c, status, rating: rating || c.rating } : c
    );
    save(updated);
  };

  return { certificates, addCertificate, updateStatus, loading };
}
