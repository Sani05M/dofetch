import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PortfolioViewer } from "@/components/PortfolioViewer";
import { Metadata } from "next";

interface PortfolioPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PortfolioPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, bio, is_public")
    .eq("portfolio_slug", slug)
    .single();

  if (!profile || !profile.is_public) {
    return { title: "Portfolio Not Found" };
  }

  return {
    title: `${profile.full_name}'s Portfolio | Adamas University`,
    description: profile.bio || "Verified Student Portfolio",
  };
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("portfolio_slug", slug)
    .single();

  if (!profile || !profile.is_public) {
    notFound();
  }

  const { data: certificates, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("student_id", profile.id)
    .eq("status", "approved")
    .order('issue_date', { ascending: false });

  if (error) {
    console.error("Error fetching certificates:", error);
  }

  return (
    <PortfolioViewer profile={profile} certificates={certificates || []} />
  );
}
