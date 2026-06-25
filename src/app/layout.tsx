import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/server";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CineList — Персональный трекер фильмов и сериалов",
  description:
    "Ведите дневник просмотров, ставьте оценки, пишите рецензии и следите за друзьями.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="ru" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#1a1a1a]">
        <Navbar profile={profile} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[#e5e7eb] py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-[#6b7280]">
            © 2024 CineList — Трекер фильмов и сериалов
          </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
