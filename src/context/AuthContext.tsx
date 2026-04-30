"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";

export type Role = "student" | "faculty";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  rollNo?: string;
  regNo?: string;
  section?: string;
  sectionsManaged?: string[];
  facultyId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const syncUser = () => {
    if (isLoaded && isSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      const metadata = clerkUser.publicMetadata as any;
      const role =
        metadata.role ||
        (email.endsWith("@stu.adamasuniversity.ac.in") ? "student" : "faculty");
      const isStudent = role === "student";

      setUser({
        id: clerkUser.id,
        name: clerkUser.fullName || (isStudent ? "Student" : "Authority"),
        email: email,
        role: role as Role,
        section: metadata.section,
        sectionsManaged: metadata.sectionsManaged,
        facultyId: metadata.facultyId,
      });
    } else if (isLoaded && !isSignedIn) {
      setUser(null);
    }
  };

  useEffect(() => {
    syncUser();

    // Background sync to Supabase profile
    const performBackgroundSync = async () => {
      if (isLoaded && isSignedIn && clerkUser) {
        const email = clerkUser.primaryEmailAddress?.emailAddress || "";
        const metadata = clerkUser.publicMetadata as any;
        const role =
          metadata.role ||
          (email.endsWith("@stu.adamasuniversity.ac.in")
            ? "student"
            : "faculty");

        try {
          // Use the onboarding API pattern but as a silent sync
          await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: role,
              fullName: clerkUser.fullName,
              email: email,
              department: metadata.department,
              batch: metadata.batch,
              section: metadata.section,
              rollNumber: metadata.rollNumber,
              regNumber: metadata.regNumber,
              sectionsManaged: metadata.sectionsManaged,
              isSync: true, // Flag to skip metadata update loop if needed
            }),
          });
        } catch (err) {
          console.warn("Background profile sync failed:", err);
        }
      }
    };

    if (isSignedIn) performBackgroundSync();
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  const refresh = async () => {
    if (clerkUser) {
      await clerkUser.reload();
      syncUser();
    }
  };

  const login = (userData: User) => {
    // Deprecated, handled by Clerk UI
  };

  const logout = async () => {
    await signOut();
    router.push("/");
  };

  // Keep loading state true if Clerk is loaded, says we are signed in, but we haven't set the local `user` state yet.
  // This prevents the refresh redirect glitch.
  const isAuthLoading = !isLoaded || (isLoaded && isSignedIn && user === null);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, refresh, isLoading: isAuthLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
