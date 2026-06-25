"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Film, Search, BookOpen, User, LogOut, Settings, Rss, Menu, X } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import type { Profile } from "@/types/database";

interface NavbarProps {
  profile?: Profile | null;
}

const navLinks = [
  { href: "/", label: "Лента", icon: Rss },
  { href: "/search", label: "Поиск", icon: Search },
  { href: "/diary", label: "Дневник", icon: BookOpen },
];

export function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#e5e7eb] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-[#e11d2a] rounded-lg flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#1a1a1a] text-lg tracking-tight">
              Cine<span className="text-[#e11d2a]">List</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "text-[#e11d2a] bg-red-50"
                    : "text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {profile ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href={`/profile/${profile.username}`}>
                  <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-[#e11d2a] transition-all">
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username} />
                    <AvatarFallback className="text-xs">{getInitials(profile.username)}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex items-center gap-1">
                  <Link href="/settings">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">Войти</Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Регистрация</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e5e7eb] bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                pathname === href
                  ? "text-[#e11d2a] bg-red-50"
                  : "text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          {profile ? (
            <>
              <Link
                href={`/profile/${profile.username}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]"
              >
                <User className="w-4 h-4" />
                Профиль
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f5f5f5]"
              >
                <Settings className="w-4 h-4" />
                Настройки
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button variant="outline" className="w-full" size="sm">Войти</Button>
              </Link>
              <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button className="w-full" size="sm">Регистрация</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
