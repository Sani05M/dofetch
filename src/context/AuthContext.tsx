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
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || "";
      const metadata = clerkUser.publicMetadata as any;
      const role = metadata.role || (email.endsWith("@stu.adamasuniversity.ac.in") ? "student" : "faculty");
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
  }, [isLoaded, isSignedIn, clerkUser]);

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
    <AuthContext.Provider value={{ user, login, logout, isLoading: isAuthLoading }}>
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
