import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Credential 2.0 | Adamos University",
  description: "Secure Digital Credentialing for Adamos University.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  manifest: "/site.webmanifest",
};

import { ClerkProvider, SignInButton, UserButton } from "@clerk/nextjs";
import { AuthProvider } from "@/context/AuthContext";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${fraunces.variable} ${inter.variable} ${jetBrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <body className="bg-bg-base text-text-primary selection:bg-accent/30">
          <AuthProvider>
            <ClientErrorBoundary>{children}</ClientErrorBoundary>
          </AuthProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
